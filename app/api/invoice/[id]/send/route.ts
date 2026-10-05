import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  DEFAULT_INVOICE_PAYMENT_TERMS,
  applyInvoiceSnapshot,
  balanceDueOf,
  formatInvoiceDueDate,
  generateInvoicePdf,
  getInvoicePaidStamp,
  invoiceFilename,
  invoiceNumberOf,
  normalizeInvoiceLineItems,
  type InvoiceBookingData,
  type InvoiceSnapshotData,
} from '@/lib/invoices'
import { sendInvoiceNotification } from '@/lib/notifications'
import { isAllowedAdminUser } from '@/lib/admin-auth'
import { limitInvoiceSend } from '@/lib/ratelimit'
import { logError, logEvent } from '@/lib/monitoring'

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
  const body = await request.json().catch(() => null) as { mode?: string; attemptId?: string } | null
  const mode = body?.mode === 'reminder' ? 'reminder' : 'invoice'
  const attemptId =
    typeof body?.attemptId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.attemptId)
      ? body.attemptId
      : null
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
        clients(first_name, last_name, email, phone),
        payments(amount, status, method, paid_at)
      `)
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('invoices')
      .select('status, invoice_number, pdf_filename, event_name, client_name, client_email, total_amount, deposit_amount, balance_due, due_date, payment_terms, line_items')
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

  if (mode === 'reminder' && !invoice) {
    return NextResponse.json({ error: 'Create and send the invoice before sending a reminder.' }, { status: 400 })
  }

  if (mode === 'reminder' && invoice?.status !== 'sent') {
    return NextResponse.json({ error: 'Only sent invoices can receive a payment reminder.' }, { status: 400 })
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

  const payments = (data as { payments?: Parameters<typeof getInvoicePaidStamp>[0] } | null)?.payments
  const paidStamp = getInvoicePaidStamp(payments, Number(effectiveBooking.quote ?? 0))
  const pdfBase64 = Buffer.from(await generateInvoicePdf(effectiveBooking, invoice, paidStamp)).toString('base64')
  const balance = invoice ? Number(invoice.balance_due ?? 0) : balanceDueOf(effectiveBooking)
  const invoiceNumber = invoice?.invoice_number || invoiceNumberOf(effectiveBooking)
  const pdfFilename = invoice?.pdf_filename || invoiceFilename(effectiveBooking)
  const lineItems = normalizeInvoiceLineItems(
    invoice?.line_items,
    effectiveBooking.event_name ?? 'DJ Services',
    effectiveBooking.quote ?? 0
  )
  const paymentTerms = invoice?.payment_terms?.trim() || DEFAULT_INVOICE_PAYMENT_TERMS

  if (mode === 'reminder' && balance <= 0) {
    return NextResponse.json({ error: 'This invoice does not have an outstanding balance.' }, { status: 400 })
  }

  const result = await sendInvoiceNotification({
    to: clientEmail,
    clientName,
    eventName: effectiveBooking.event_name ?? 'your event',
    invoiceNumber,
    balanceDue: formatCurrency(balance),
    pdfBase64,
    pdfFilename,
    dueDate: formatInvoiceDueDate(invoice?.due_date),
    mode,
  }, {
    idempotencyKey: attemptId ? `invoice-${mode}-${booking.id}-${attemptId}` : undefined,
  })

  if (!result.ok) {
    logEvent('error', 'Invoice email send failed', {
      operation: 'invoice_send',
      bookingId: booking.id,
      mode,
      reason: result.reason,
      detail: result.detail,
    })
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

    if (mode === 'invoice') {
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
          due_date: invoice?.due_date ?? null,
          payment_terms: paymentTerms,
          line_items: lineItems,
          sent_at: sentAt,
        }, { onConflict: 'booking_id' })

      if (invoiceError) {
        logEvent('error', 'Invoice state save failed after email send', {
          operation: 'invoice_state_save',
          bookingId: booking.id,
          errorMessage: invoiceError.message,
        })
      }
    }

    await admin.from('notes').insert({
      booking_id: booking.id,
      body: mode === 'reminder'
        ? `Invoice #${invoiceNumber} payment reminder sent to ${clientEmail}.`
        : `Invoice email sent to ${clientEmail}.`,
    })
  } catch (error) {
    logError('Invoice post-send bookkeeping failed', error, {
      operation: 'invoice_post_send_bookkeeping',
      bookingId: booking.id,
      mode,
    })
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
