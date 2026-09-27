import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Badge from '@/components/admin/Badge'
import { startStripeDepositCheckoutAction } from '@/app/actions/deposits'
import { formatPaymentMethodLabel, getDepositConfirmedVia, getDepositPaidAt, getDepositStatus } from '@/lib/booking-deposit'
import { getOutstandingDeposit, getReceivedPaymentTotal } from '@/lib/booking-finance'
import { getStripePublishableKey } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'

export const metadata: Metadata = {
  title: 'Pay Deposit',
  robots: {
    index: false,
    follow: false,
  },
}

interface PayBookingRow {
  id: string
  event_name: string
  event_date: string
  event_timezone: string
  status: 'inquiry' | 'confirmed' | 'completed' | 'cancelled'
  quote: number | null
  deposit_amount: number | null
  clients: {
    first_name: string | null
    last_name: string | null
    email: string | null
  } | Array<{
    first_name: string | null
    last_name: string | null
    email: string | null
  }> | null
  payments: Array<{
    amount: number
    type: 'deposit' | 'balance' | 'full' | 'refund'
    method: string | null
    status: 'pending' | 'received' | 'refunded'
    paid_at: string | null
  }> | null
}

async function getBooking(id: string): Promise<PayBookingRow | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      event_date,
      event_timezone,
      status,
      quote,
      deposit_amount,
      clients(first_name, last_name, email),
      payments(amount, type, method, status, paid_at)
    `)
    .eq('id', id)
    .maybeSingle()

  return (data as PayBookingRow | null) ?? null
}

function getMessage(param: string | string[] | undefined) {
  if (!param) return null
  return Array.isArray(param) ? param[0] ?? null : param
}

function formatCurrency(value: number | null) {
  return (value ?? 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function PayBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const booking = await getBooking(id)

  if (!booking) notFound()

  const client = Array.isArray(booking.clients) ? booking.clients[0] ?? null : booking.clients
  const payments = booking.payments ?? []
  const receivedTotal = getReceivedPaymentTotal(payments)
  const outstandingDeposit = getOutstandingDeposit(booking.deposit_amount, payments)
  const depositStatus = getDepositStatus(booking.deposit_amount, payments)
  const depositPaidAt = getDepositPaidAt(booking.deposit_amount, payments)
  const depositConfirmedVia = getDepositConfirmedVia(booking.deposit_amount, payments)
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY && getStripePublishableKey())
  const errorMessage = getMessage(resolvedSearchParams?.error)
  const successMessage = getMessage(resolvedSearchParams?.success)
  const checkoutState = getMessage(resolvedSearchParams?.checkout)

  return (
    <main
      style={{
        minHeight: '100svh',
        background:
          'radial-gradient(circle at top, rgba(143,45,60,0.28), transparent 36%), linear-gradient(180deg, #0e0b0a 0%, #161210 100%)',
        color: 'var(--white)',
        padding: 'max(48px, calc(var(--safe-top) + 32px)) max(20px, var(--safe-right)) calc(80px + var(--safe-bottom)) max(20px, var(--safe-left))',
      }}
    >
      <div
        style={{
          maxWidth: '980px',
          margin: '0 auto',
          display: 'grid',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            The Bae Agenda
          </Link>
          <Badge variant={depositStatus === 'paid' ? 'paid' : depositStatus === 'pending' ? 'pending' : 'unpaid'} label={`Deposit ${depositStatus}`} />
        </div>

        {errorMessage && (
          <div style={{ border: '1px solid rgba(232, 93, 117, 0.28)', background: 'rgba(232, 93, 117, 0.08)', color: '#fecdd3', padding: '14px 16px' }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{ border: '1px solid rgba(52, 211, 153, 0.24)', background: 'rgba(52, 211, 153, 0.08)', color: '#bbf7d0', padding: '14px 16px' }}>
            {successMessage}
          </div>
        )}

        {checkoutState === 'success' && depositStatus !== 'paid' && (
          <div style={{ border: '1px solid rgba(201, 168, 76, 0.24)', background: 'rgba(201, 168, 76, 0.08)', color: '#fef3c7', padding: '14px 16px' }}>
            Checkout returned successfully. We&apos;re waiting for Stripe&apos;s webhook to confirm the payment.
          </div>
        )}

        {checkoutState === 'cancelled' && (
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'var(--muted)', padding: '14px 16px' }}>
            Checkout was cancelled. You can try again below or use the manual payment option.
          </div>
        )}

        <section
          style={{
            border: '1px solid var(--border)',
            background: 'rgba(8, 8, 10, 0.84)',
            padding: '28px',
            display: 'grid',
            gap: '22px',
          }}
        >
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--eyebrow)' }}>
              Booking Deposit
            </div>
            <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.08 }}>
              {booking.event_name}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '680px' }}>
              Secure the date with Stripe Checkout or follow the manual Zelle / Cash App instructions shared with you by the DJ B.A.E. team.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Booking ID', value: booking.id.slice(0, 8).toUpperCase() },
              { label: 'Event Date', value: formatDateTime(booking.event_date) },
              { label: 'Quote', value: formatCurrency(booking.quote) },
              { label: 'Deposit Due', value: formatCurrency(booking.deposit_amount) },
              { label: 'Received So Far', value: formatCurrency(receivedTotal) },
              { label: 'Still Owed', value: formatCurrency(outstandingDeposit) },
            ].map((item) => (
              <div key={item.label} style={{ border: '1px solid var(--border)', background: 'var(--bg-sunken)', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: item.label === 'Booking ID' ? '14px' : '18px', fontFamily: item.label === 'Booking ID' ? 'DM Sans, sans-serif' : 'Conthrax, sans-serif' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {depositStatus === 'paid' ? (
            <div style={{ border: '1px solid rgba(52, 211, 153, 0.24)', background: 'rgba(52, 211, 153, 0.08)', padding: '18px 20px', display: 'grid', gap: '8px' }}>
              <div style={{ fontFamily: 'Conthrax, sans-serif', color: '#bbf7d0' }}>Deposit Confirmed</div>
              <div style={{ color: 'var(--white)', fontSize: '14px', lineHeight: 1.7 }}>
                Confirmed {depositPaidAt ? formatDateTime(depositPaidAt) : 'recently'}
                {depositConfirmedVia ? ` via ${depositConfirmedVia === 'stripe' ? 'Stripe' : 'manual confirmation'}` : ''}.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <form action={startStripeDepositCheckoutAction} style={{ border: '1px solid var(--border)', background: 'var(--bg-sunken)', padding: '20px', display: 'grid', gap: '12px' }}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '18px' }}>Pay with Stripe</div>
                <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7 }}>
                  Pay the deposit online now. Stripe will send us a secure webhook confirmation before the booking updates to paid.
                </p>
                <button
                  type="submit"
                  disabled={!stripeReady || outstandingDeposit <= 0}
                  style={{
                    appearance: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(143,45,60,0.4)',
                    background: !stripeReady || outstandingDeposit <= 0 ? 'rgba(143,45,60,0.16)' : 'linear-gradient(135deg, #8f2d3c, #c4844a)',
                    color: 'var(--white)',
                    padding: '14px 18px',
                    minHeight: '48px',
                    fontSize: '12px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    cursor: !stripeReady || outstandingDeposit <= 0 ? 'not-allowed' : 'pointer',
                    opacity: !stripeReady || outstandingDeposit <= 0 ? 0.6 : 1,
                    textAlign: 'center',
                  }}
                >
                  Open Stripe Checkout
                </button>
                {!stripeReady && (
                  <div style={{ color: '#fef3c7', fontSize: '12px', lineHeight: 1.6 }}>
                    Stripe keys are still being added. Use the manual option if you need to pay before the Stripe setup finishes.
                  </div>
                )}
              </form>

              <div style={{ border: '1px solid var(--border)', background: 'var(--bg-sunken)', padding: '20px', display: 'grid', gap: '12px' }}>
                <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '18px' }}>Manual Zelle / Cash App</div>
                <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7 }}>
                  If you were given a manual payment option, include your booking ID in the memo and send proof of payment to{' '}
                  <a href={`mailto:${process.env.BOOKING_ALERT_EMAIL ?? DEFAULT_BOOKING_EMAIL}`} style={{ color: 'var(--white)' }}>
                    {process.env.BOOKING_ALERT_EMAIL ?? DEFAULT_BOOKING_EMAIL}
                  </a>.
                </p>
                <div style={{ border: '1px dashed rgba(255,255,255,0.18)', padding: '12px 14px', fontSize: '13px', lineHeight: 1.7, overflowWrap: 'anywhere' }}>
                  Manual payments do not auto-confirm. The team will review the transfer and mark the deposit paid from the admin panel.
                </div>
              </div>
            </div>
          )}

          {payments.length > 0 && (
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--eyebrow)' }}>
                Payment History
              </div>
              {payments.map((payment, index) => (
                <div key={`${payment.paid_at ?? 'payment'}-${index}`} style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', padding: '14px 16px', display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ color: 'var(--white)' }}>
                      {formatCurrency(payment.amount)} · {payment.type}
                      {payment.method ? ` · ${formatPaymentMethodLabel(payment.method)}` : ''}
                    </div>
                    <Badge variant={payment.status === 'received' ? 'received' : payment.status === 'pending' ? 'pending' : 'refunded'} />
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    {payment.paid_at ? `Updated ${formatDateTime(payment.paid_at)}` : 'Awaiting confirmation'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {client?.email && (
            <div style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.7 }}>
              Payment updates for this booking are tied to {client.email}.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
