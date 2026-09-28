import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyInvoiceSnapshot, generateInvoicePdf, invoiceFilename, type InvoiceBookingData, type InvoiceSnapshotData } from '@/lib/invoices'
import { isAllowedAdminUser } from '@/lib/admin-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const [{ data }, { data: invoiceData }] = await Promise.all([
    supabase
    .from('bookings')
    .select(`
      id, event_name, event_type, event_date, event_end_time, event_timezone, venue, city,
      package, hours, quote, deposit_amount, notes,
      clients(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .maybeSingle(),
    supabase
      .from('invoices')
      .select('invoice_number, pdf_filename, event_name, client_name, client_email, total_amount, deposit_amount, balance_due, due_date, payment_terms, line_items')
      .eq('booking_id', id)
      .maybeSingle(),
  ])

  const booking = (data as InvoiceBookingData | null) ?? null

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const invoice = (invoiceData as InvoiceSnapshotData | null) ?? null
  const effectiveBooking = applyInvoiceSnapshot(booking, invoice)
  const pdfBytes = await generateInvoicePdf(effectiveBooking, invoice)
  const filename = invoice?.pdf_filename || invoiceFilename(effectiveBooking)

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store, max-age=0',
      'Pragma':              'no-cache',
      'X-Robots-Tag':        'noindex, nofollow',
    },
  })
}
