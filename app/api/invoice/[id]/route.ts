import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, event_name, event_type, event_date, venue, city,
      package, hours, quote, deposit_amount, notes,
      clients(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .maybeSingle()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const client = booking.clients as {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null

  const clientName = client
    ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim()
    : 'Client'

  const eventDate = booking.event_date
    ? new Date(booking.event_date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  const location = [booking.venue, booking.city].filter(Boolean).join(' — ')

  const description = [
    booking.package,
    booking.hours ? `${booking.hours} hr${booking.hours !== 1 ? 's' : ''}` : null,
    eventDate,
    location,
  ].filter(Boolean).join(' · ')

  const total   = booking.quote         ?? 0
  const deposit = booking.deposit_amount ?? 0
  const balance = total - deposit

  const invoicePayload = {
    logo:        'https://thebaeagenda.com/photos/hero-bg.jpg',
    from:        'DJ B.A.E.\nThe Bae Agenda\nbaebookings@proton.me',
    to:          [clientName, client?.email, client?.phone].filter(Boolean).join('\n'),
    number:      id.slice(0, 8).toUpperCase(),
    date:        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    due_date:    eventDate,
    currency:    'usd',
    items: [
      {
        name:     booking.event_name ?? 'DJ Services',
        description,
        quantity: 1,
        unit_cost: total,
      },
      ...(deposit > 0 ? [{
        name:      'Deposit Paid',
        quantity:  1,
        unit_cost: -deposit,
      }] : []),
    ],
    notes: booking.notes ?? '',
    terms: 'Balance due on or before the event date. All sales final.',
    'amount_paid': 0,
    tax: 0,
  }

  const response = await fetch('https://invoice-generator.com', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(invoicePayload),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }

  const pdfBuffer = await response.arrayBuffer()
  const filename  = `invoice-${clientName.replace(/\s+/g, '-').toLowerCase()}-${id.slice(0, 8)}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
