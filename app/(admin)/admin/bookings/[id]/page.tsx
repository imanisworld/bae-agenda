import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import Badge from '@/components/admin/Badge'
import SendInvoiceButton from '@/components/admin/SendInvoiceButton'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { updateBookingDetailsAction } from '@/app/actions/bookings'
import type { BookingStatus } from '@/types/index'

interface BookingDetailRow {
  id: string
  event_name: string
  event_type: string | null
  event_date: string
  event_end_time: string | null
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

function formatCurrency(value: number | null): string {
  return (value ?? 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

async function getBooking(id: string): Promise<BookingDetailRow | null> {
  const supabase = createClient()
  const { data } = await supabase
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
  const total = booking.quote ?? 0
  const deposit = booking.deposit_amount ?? 0
  const balance = total - deposit

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Edit Booking"
        subtitle="Adjust booking details, notes, pricing, and status."
        action={{ label: 'Back To Bookings', href: '/admin/bookings' }}
      />

      <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
          <Badge variant={booking.status} />
          {clientName && <span style={{ color: 'var(--white)', fontSize: '14px' }}>{clientName}</span>}
          {booking.clients?.email && <span className="muted">{booking.clients.email}</span>}
          {booking.clients?.phone && <span className="muted">{booking.clients.phone}</span>}
        </div>
      </div>

      <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="admin-section-title" style={{ marginBottom: '10px' }}>Invoice</div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
              Preview the client invoice, download the PDF, and keep the quote, deposit, and balance in sync with this booking.
            </p>
          </div>

          <div className="admin-form-actions">
            <Link href={`/admin/bookings/${booking.id}/invoice`} className="admin-btn-primary">
              Preview Invoice →
            </Link>
            <SendInvoiceButton
              bookingId={booking.id}
              clientEmail={booking.clients?.email}
            />
            <a href={`/api/invoice/${booking.id}`} className="admin-btn-ghost">
              Download PDF
            </a>
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
        }}>
          {[
            { label: 'Quote', value: formatCurrency(total) },
            { label: 'Deposit', value: formatCurrency(deposit) },
            { label: 'Balance Due', value: formatCurrency(balance) },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-sunken)',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                {item.label}
              </div>
              <div style={{ color: item.label === 'Balance Due' ? 'var(--violet)' : 'var(--white)', fontSize: '18px', fontFamily: 'Conthrax, sans-serif' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form action={updateBookingDetailsAction} className="admin-section" style={{ padding: '24px' }}>
        <input type="hidden" name="id" value={booking.id} />
        <div className="admin-form-grid">
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Event Name *</span>
            <input name="event_name" required defaultValue={booking.event_name} style={inputStyle()} />
          </label>

          <div className="admin-form-grid-two">
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

          <div className="admin-form-grid-two-wide">
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

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Event End Time</span>
            <input
              name="event_end_time"
              type="datetime-local"
              defaultValue={booking.event_end_time ? toDateTimeLocal(booking.event_end_time) : ''}
              style={inputStyle()}
            />
          </label>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Venue</span>
              <input name="venue" defaultValue={booking.venue ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">City</span>
              <input name="city" defaultValue={booking.city ?? ''} style={inputStyle()} />
            </label>
          </div>

          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Package</span>
              <input name="package" defaultValue={booking.package ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Hours</span>
              <input name="hours" type="number" min={0} step="0.5" defaultValue={booking.hours ?? undefined} style={inputStyle()} />
            </label>
          </div>

          <div className="admin-form-grid-two">
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

          <div className="admin-form-actions">
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
