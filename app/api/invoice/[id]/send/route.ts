import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { balanceDueOf, generateInvoicePdf, invoiceFilename, invoiceNumberOf, type InvoiceBookingData } from '@/lib/invoices'
import { sendInvoiceNotification } from '@/lib/notifications'

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('bookings')
    .select(`
      id,
      event_name,
      event_type,
      event_date,
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
    .maybeSingle()

  const booking = (data as InvoiceBookingData | null) ?? null

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  }

  const clientEmail = booking.clients?.email?.trim()
  if (!clientEmail) {
    return NextResponse.json({ error: 'This booking does not have a client email yet.' }, { status: 400 })
  }

  const clientName = [booking.clients?.first_name, booking.clients?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Client'

  const pdfBase64 = Buffer.from(await generateInvoicePdf(booking)).toString('base64')
  const balance = balanceDueOf(booking)

  const result = await sendInvoiceNotification({
    to: clientEmail,
    clientName,
    eventName: booking.event_name ?? 'your event',
    invoiceNumber: invoiceNumberOf(booking),
    balanceDue: formatCurrency(balance),
    pdfBase64,
    pdfFilename: invoiceFilename(booking),
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.detail || 'Invoice email failed to send.' },
      { status: result.reason === 'missing_config' ? 500 : 502 }
    )
  }

  return NextResponse.json({ success: true })
}
