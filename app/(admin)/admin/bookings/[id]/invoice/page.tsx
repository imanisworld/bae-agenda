import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/admin/PageHeader'

export const dynamic = 'force-dynamic'

async function getBooking(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select(`
      id, event_name, event_type, event_date, venue, city,
      package, hours, quote, deposit_amount, notes,
      clients(first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .maybeSingle()
  return data
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px 1fr',
      gap: '12px',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      fontSize: '13px',
    }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color: 'var(--white)' }}>{value ?? '—'}</span>
    </div>
  )
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const booking = await getBooking(id)
  if (!booking) notFound()

  const client = booking.clients as {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null

  const clientName = client
    ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim()
    : '—'

  const eventDate = booking.event_date
    ? new Date(booking.event_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  const total   = booking.quote         ?? 0
  const deposit = booking.deposit_amount ?? 0
  const balance = total - deposit

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div style={{ padding: '40px 48px', maxWidth: '860px' }}>
      <PageHeader
        title="Invoice Preview"
        subtitle={`${booking.event_name} · ${clientName}`}
        action={{ label: 'Back to Booking', href: `/admin/bookings/${id}` }}
      />

      {/* Invoice card */}
      <div className="admin-section" style={{ padding: '32px', marginBottom: '24px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: '18px',
              color: 'var(--white)',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}>
              DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.7 }}>
              The Bae Agenda<br />
              baebookings@proton.me
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: '22px',
              color: 'var(--violet)',
              letterSpacing: '0.06em',
              marginBottom: '4px',
            }}>
              INVOICE
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              #{id.slice(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div style={{
          background: 'var(--bg-sunken)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
            Bill To
          </div>
          <div style={{ fontSize: '14px', color: 'var(--white)', fontWeight: 500 }}>{clientName}</div>
          {client?.email && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{client.email}</div>}
          {client?.phone && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{client.phone}</div>}
        </div>

        {/* Event details */}
        <div style={{ marginBottom: '24px' }}>
          <Row label="Event" value={booking.event_name} />
          <Row label="Date" value={eventDate} />
          {booking.venue && <Row label="Venue" value={booking.venue} />}
          {booking.city  && <Row label="City"  value={booking.city}  />}
          {booking.package && <Row label="Package" value={booking.package} />}
          {booking.hours   && <Row label="Hours"   value={`${booking.hours} hr${booking.hours !== 1 ? 's' : ''}`} />}
        </div>

        {/* Totals */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', gap: '48px', fontSize: '13px' }}>
            <span style={{ color: 'var(--muted)' }}>Subtotal</span>
            <span style={{ color: 'var(--white)' }}>{fmt(total)}</span>
          </div>
          {deposit > 0 && (
            <div style={{ display: 'flex', gap: '48px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Deposit Paid</span>
              <span style={{ color: 'var(--muted)' }}>−{fmt(deposit)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', gap: '48px',
            fontSize: '16px', fontWeight: 600,
            borderTop: '1px solid var(--border)',
            paddingTop: '10px', marginTop: '4px',
          }}>
            <span style={{ color: 'var(--muted)' }}>Balance Due</span>
            <span style={{ color: 'var(--violet)', fontFamily: 'Conthrax, sans-serif' }}>{fmt(balance)}</span>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div style={{
            marginTop: '24px',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: 1.7,
          }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '6px' }}>Notes</div>
            {booking.notes}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          fontSize: '11px',
          color: 'rgba(250,248,243,0.3)',
          borderTop: '1px solid var(--border)',
          paddingTop: '14px',
        }}>
          Balance due on or before the event date. All sales final.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <a
          href={`/api/invoice/${id}`}
          download
          className="admin-btn-primary"
        >
          Download PDF
        </a>
        <Link href={`/admin/bookings/${id}`} className="admin-btn-ghost">
          Back to Booking
        </Link>
      </div>
    </div>
  )
}
