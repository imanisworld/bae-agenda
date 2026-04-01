import Link from 'next/link'
import { portalSignOutAction } from '@/app/actions/portal'
import Badge from '@/components/admin/Badge'
import { getOutstandingBalance, getReceivedPaymentTotal } from '@/lib/booking-finance'
import { getBookingWorkflowPaymentStatus } from '@/lib/booking-workflow'
import { requirePortalSessionClient } from '@/lib/portal-auth'
import { createAdminClient } from '@/lib/supabase/admin'

type PortalBookingRow = {
  id: string
  event_name: string
  event_date: string
  event_timezone: string
  venue: string | null
  city: string | null
  status: 'inquiry' | 'confirmed' | 'completed' | 'cancelled'
  lifecycle_status: 'new' | 'contacted' | 'negotiating' | 'confirmed' | 'completed' | 'lost' | null
  payment_status: 'unpaid' | 'deposit_requested' | 'deposit_paid' | 'balance_requested' | 'paid' | null
  quote: number | null
  deposit_amount: number | null
  payments: Array<{
    amount: number
    status: 'pending' | 'received' | 'refunded'
  }> | null
}

async function getPortalBookings(clientId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      event_date,
      event_timezone,
      venue,
      city,
      status,
      lifecycle_status,
      payment_status,
      quote,
      deposit_amount,
      payments(amount, status)
    `)
    .eq('client_id', clientId)
    .order('event_date', { ascending: true })

  return (data as PortalBookingRow[] | null) ?? []
}

function formatCurrency(value: number | null) {
  return (value ?? 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

function formatDateTime(value: string, timeZone: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
}

function toBadgeVariant(status: PortalBookingRow['payment_status']) {
  switch (status) {
    case 'paid':
      return 'paid'
    case 'deposit_paid':
    case 'balance_requested':
    case 'deposit_requested':
      return 'pending'
    default:
      return 'unpaid'
  }
}

export default async function PortalHomePage() {
  const client = await requirePortalSessionClient()
  const bookings = await getPortalBookings(client.id)

  return (
    <section className="section-container" style={{ maxWidth: '1100px', paddingTop: '104px', paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Client Portal</span>
            <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.05 }}>
              Welcome back, {client.first_name}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.75, maxWidth: '38rem' }}>
              Review your booking details, check payment progress, and open the payment page when you&apos;re ready.
            </p>
          </div>

          <form action={portalSignOutAction}>
            <button type="submit" className="inline-link" style={{ background: 'none', border: 'none', padding: '10px 0', minHeight: '44px', cursor: 'pointer' }}>
              Sign Out
            </button>
          </form>
        </div>

        {bookings.length === 0 ? (
          <div style={{ border: '1px solid var(--border)', background: 'rgba(10,10,14,0.92)', padding: '24px', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7 }}>
            We couldn&apos;t find any bookings on this account yet. If you think that&apos;s a mismatch, contact the DJ B.A.E. team and we&apos;ll help link the right number.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {bookings.map((booking) => {
              const receivedTotal = getReceivedPaymentTotal(booking.payments)
              const outstandingBalance = getOutstandingBalance(booking.quote, booking.payments)
              const paymentStatus = getBookingWorkflowPaymentStatus({
                quote: booking.quote,
                depositAmount: booking.deposit_amount,
                lifecycleStatus: booking.lifecycle_status ?? undefined,
                payments: booking.payments,
              })

              return (
                <article
                  key={booking.id}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'rgba(10,10,14,0.92)',
                    padding: '24px',
                    display: 'grid',
                    gap: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <h2 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(22px, 4vw, 30px)', lineHeight: 1.08 }}>
                        {booking.event_name}
                      </h2>
                      <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7 }}>
                        {formatDateTime(booking.event_date, booking.event_timezone)}
                        {booking.venue || booking.city ? ` • ${[booking.venue, booking.city].filter(Boolean).join(', ')}` : ''}
                      </p>
                    </div>

                    <Badge variant={toBadgeVariant(paymentStatus)} label={paymentStatus.replaceAll('_', ' ')} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    {[
                      { label: 'Quote', value: formatCurrency(booking.quote) },
                      { label: 'Deposit', value: formatCurrency(booking.deposit_amount) },
                      { label: 'Paid So Far', value: formatCurrency(receivedTotal) },
                      { label: 'Remaining', value: formatCurrency(outstandingBalance) },
                    ].map((item) => (
                      <div key={item.label} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-sunken)', padding: '14px 16px' }}>
                        <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                          {item.label}
                        </div>
                        <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '16px' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Link href={`/portal/bookings/${booking.id}`} className="inline-link" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
                      View Booking Details
                    </Link>
                    <Link href={`/pay/${booking.id}`} className="btn-primary">
                      Open Payment Page
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
