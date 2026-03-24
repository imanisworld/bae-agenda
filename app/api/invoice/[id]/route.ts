import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInvoicePdf, invoiceFilename, type InvoiceBookingData } from '@/lib/invoices'
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

  const { data } = await supabase
    .from('bookings')
    .select(`
      id, event_name, event_type, event_date, event_end_time, event_timezone, venue, city,
      package, hours, quote, deposit_amount, notes,
      clients(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .maybeSingle()

  const booking = (data as InvoiceBookingData | null) ?? null

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const pdfBytes = await generateInvoicePdf(booking)
  const filename = invoiceFilename(booking)

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
