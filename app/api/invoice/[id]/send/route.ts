import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyInvoiceSnapshot, balanceDueOf, generateInvoicePdf, invoiceFilename, invoiceNumberOf, type InvoiceBookingData, type InvoiceSnapshotData } from '@/lib/invoices'
import { sendInvoiceNotification } from '@/lib/notifications'
import { isAllowedAdminUser } from '@/lib/admin-auth'
import { limitInvoiceSend } from '@/lib/ratelimit'

function isAllowedOrigin(origin: string, requestHost: string) {
  if (!origin) return true

  try {
    const url = new URL(origin)
    if (['localhost', '127.0.0.1'].includes(url.hostname)) {
      return true
    }

    return Boolean(requestHost) && url.host === requestHost
  } catch {
    return false
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin') ?? ''
  const requestHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  if (!isAllowedOrigin(origin, requestHost)) {
    return NextResponse.json({ error: 'Invalid submission origin.' }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  if (!auth.user || !isAllowedAdminUser(auth.user)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    )
  }

  const rateLimit = await limitInvoiceSend(request.headers, id)
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many invoice send attempts. Please wait a few minutes and try again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          'Cache-Control': 'no-store, max-age=0',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    )
  }

  const [{ data }, { data: invoiceData }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id,
        event_name,
        event_type,
        event_date,
        event_end_time,
        event_timezone,
        venue,
        city,
        package,
        hours,
        quote,
        deposit_amount,
        notes,
        clients(first_name, last_name, email, phone)
      `)
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('invoices')
      .select('status, invoice_number, pdf_filename, event_name, client_name, client_email, total_amount, deposit_amount, balance_due')
      .eq('booking_id', id)
      .maybeSingle(),
  ])

  const booking = (data as InvoiceBookingData | null) ?? null

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  }

  const invoice = (invoiceData as (InvoiceSnapshotData & { status: 'draft' | 'sent' | 'paid' | 'void' }) | null) ?? null

  if (invoice?.status === 'void') {
    return NextResponse.json({ error: 'Void invoices cannot be sent.' }, { status: 400 })
  }

  if (invoice?.status === 'paid') {
    return NextResponse.json({ error: 'Paid invoices cannot be sent again from the invoice workflow.' }, { status: 400 })
  }

  const effectiveBooking = applyInvoiceSnapshot(booking, invoice)
  const clientEmail = effectiveBooking.clients?.email?.trim()
  if (!clientEmail) {
    return NextResponse.json({ error: 'This invoice does not have a client email yet.' }, { status: 400 })
  }

  const clientName = [effectiveBooking.clients?.first_name, effectiveBooking.clients?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Client'

  const pdfBase64 = Buffer.from(await generateInvoicePdf(effectiveBooking)).toString('base64')
  const balance = invoice ? Number(invoice.balance_due ?? 0) : balanceDueOf(effectiveBooking)
  const invoiceNumber = invoice?.invoice_number || invoiceNumberOf(effectiveBooking)
  const pdfFilename = invoice?.pdf_filename || invoiceFilename(effectiveBooking)

  const result = await sendInvoiceNotification({
    to: clientEmail,
    clientName,
    eventName: effectiveBooking.event_name ?? 'your event',
    invoiceNumber,
    balanceDue: formatCurrency(balance),
    pdfBase64,
    pdfFilename,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.detail || 'Invoice email failed to send.' },
      {
        status: result.reason === 'missing_config' ? 500 : 502,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    )
  }

  try {
    const admin = createAdminClient()
    const sentAt = new Date().toISOString()

    const { error: invoiceError } = await admin
      .from('invoices')
      .upsert({
        booking_id: booking.id,
        status: 'sent',
        invoice_number: invoiceNumber,
        pdf_filename: pdfFilename,
        event_name: effectiveBooking.event_name,
        client_name: clientName,
        client_email: clientEmail,
        total_amount: effectiveBooking.quote ?? 0,
        deposit_amount: effectiveBooking.deposit_amount ?? 0,
        balance_due: balance,
        sent_at: sentAt,
      }, { onConflict: 'booking_id' })

    if (invoiceError) {
      console.error('[invoice-send] unable to save invoice state:', invoiceError)
    }

    await admin.from('notes').insert({
      booking_id: booking.id,
      body: `Invoice email sent to ${clientEmail}.`,
    })
  } catch (error) {
    console.error('[invoice-send] post-send bookkeeping failed:', error)
  }

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  )
}
