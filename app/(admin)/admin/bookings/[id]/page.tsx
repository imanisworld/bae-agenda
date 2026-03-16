import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import Badge from '@/components/admin/Badge'
import { createClient } from '@/lib/supabase/server'
import { updateBookingDetailsAction } from '@/app/actions/bookings'
import type { BookingStatus } from '@/types/index'

interface BookingDetailRow {
  id: string
  event_name: string
  event_type: string | null
  event_date: string
  event_timezone: string
  venue: string | null
  city: string | null
  package: string | null
  hours: number | null
  quote: number | null
  deposit_amount: number | null
  status: BookingStatus
  notes: string | null
  clients: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: 'var(--off-black)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
    padding: '11px 13px',
    fontSize: '13px',
    fontFamily: 'DM Sans, sans-serif',
  }
}

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const offsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

async function getBooking(id: string): Promise<BookingDetailRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      id,
      event_name,
      event_type,
      event_date,
      event_timezone,
      venue,
      city,
      package,
      hours,
      quote,
      deposit_amount,
      status,
      notes,
      clients(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .maybeSingle()

  return (data as BookingDetailRow | null) ?? null
}

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const booking = await getBooking(id)
  if (!booking) notFound()

  const clientName = booking.clients
    ? `${booking.clients.first_name ?? ''} ${booking.clients.last_name ?? ''}`.trim()
    : ''

  return (
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
      <PageHeader
        title="Edit Booking"
        subtitle="Adjust booking details, notes, pricing, and status."
        action={{ label: 'Back To Bookings', href: '/admin/bookings' }}
      />

      <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge variant={booking.status} />
          {clientName && <span style={{ color: 'var(--white)', fontSize: '14px' }}>{clientName}</span>}
          {booking.clients?.email && <span className="muted">{booking.clients.email}</span>}
          {booking.clients?.phone && <span className="muted">{booking.clients.phone}</span>}
        </div>
      </div>

      <form action={updateBookingDetailsAction} className="admin-section" style={{ padding: '24px' }}>
        <input type="hidden" name="id" value={booking.id} />
        <div style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Event Name *</span>
            <input name="event_name" required defaultValue={booking.event_name} style={inputStyle()} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Event Type</span>
              <input name="event_type" defaultValue={booking.event_type ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Status *</span>
              <select name="status" defaultValue={booking.status} style={inputStyle()}>
                <option value="inquiry">Inquiry</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Event Date & Time *</span>
              <input
                name="event_date"
                type="datetime-local"
                required
                defaultValue={toDateTimeLocal(booking.event_date)}
                style={inputStyle()}
              />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Timezone *</span>
              <input name="event_timezone" required defaultValue={booking.event_timezone} style={inputStyle()} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Venue</span>
              <input name="venue" defaultValue={booking.venue ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">City</span>
              <input name="city" defaultValue={booking.city ?? ''} style={inputStyle()} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Package</span>
              <input name="package" defaultValue={booking.package ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Hours</span>
              <input name="hours" type="number" min={0} step="0.5" defaultValue={booking.hours ?? undefined} style={inputStyle()} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Quote</span>
              <input name="quote" type="number" min={0} step="1" defaultValue={booking.quote ?? undefined} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Deposit Amount</span>
              <input name="deposit_amount" type="number" min={0} step="1" defaultValue={booking.deposit_amount ?? undefined} style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Notes</span>
            <textarea name="notes" rows={6} defaultValue={booking.notes ?? ''} style={inputStyle()} />
          </label>

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button type="submit" className="admin-btn-primary">
              Save Changes
            </button>
            <Link href="/admin/bookings" className="admin-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
