import Link from 'next/link'
import { notFound } from 'next/navigation'
import Badge from '@/components/admin/Badge'
import { submitPortalBookingRequestAction } from '@/app/actions/portal'
import { getOutstandingBalance, getReceivedPaymentTotal } from '@/lib/booking-finance'
import { getBookingWorkflowPaymentStatus } from '@/lib/booking-workflow'
import { requirePortalSessionClient } from '@/lib/portal-auth'
import { createAdminClient } from '@/lib/supabase/admin'

type PortalBookingDetail = {
  id: string
  client_id: string | null
  event_name: string
  event_type: string | null
  event_date: string
  event_timezone: string
  venue: string | null
  city: string | null
  package: string | null
  notes: string | null
  quote: number | null
  deposit_amount: number | null
  status: 'inquiry' | 'confirmed' | 'completed' | 'cancelled'
  lifecycle_status: 'new' | 'contacted' | 'negotiating' | 'confirmed' | 'completed' | 'lost' | null
  payment_status: 'unpaid' | 'deposit_requested' | 'deposit_paid' | 'balance_requested' | 'paid' | null
  payments: Array<{
    amount: number
    type: 'deposit' | 'balance' | 'full' | 'refund'
    method: string | null
    status: 'pending' | 'received' | 'refunded'
    paid_at: string | null
  }> | null
  booking_portal_requests: Array<{
    id: string
    type: 'update' | 'cancellation'
    message: string
    preferred_contact: 'phone' | 'email' | null
    status: 'new' | 'reviewed' | 'resolved'
    resolved_at: string | null
    created_at: string
  }> | null
}

async function getBooking(id: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('bookings')
    .select(`
      id,
      client_id,
      event_name,
      event_type,
      event_date,
      event_timezone,
      venue,
      city,
      package,
      notes,
      quote,
      deposit_amount,
      status,
      lifecycle_status,
      payment_status,
      payments(amount, type, method, status, paid_at),
      booking_portal_requests(id, type, message, preferred_contact, status, resolved_at, created_at)
    `)
    .eq('id', id)
    .maybeSingle()

  return (data as PortalBookingDetail | null) ?? null
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

function formatShortDate(value: string | null) {
  if (!value) return 'Pending'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Pending'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getMessage(param: string | string[] | undefined) {
  if (!param) return null
  return Array.isArray(param) ? param[0] ?? null : param
}

function toPaymentBadgeVariant(status: PortalBookingDetail['payment_status']) {
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

function toPortalRequestBadgeVariant(status: 'new' | 'reviewed' | 'resolved') {
  switch (status) {
    case 'resolved':
      return 'paid'
    case 'reviewed':
      return 'pending'
    default:
      return 'unpaid'
  }
}

export default async function PortalBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{
    request_success?: string | string[]
    request_error?: string | string[]
  }>
}) {
  const client = await requirePortalSessionClient()
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const booking = await getBooking(id)

  if (!booking || booking.client_id !== client.id) {
    notFound()
  }

  const requestSuccess = getMessage(resolvedSearchParams?.request_success)
  const requestError = getMessage(resolvedSearchParams?.request_error)
  const receivedTotal = getReceivedPaymentTotal(booking.payments)
  const outstandingBalance = getOutstandingBalance(booking.quote, booking.payments)
  const paymentStatus = getBookingWorkflowPaymentStatus({
    quote: booking.quote,
    depositAmount: booking.deposit_amount,
    lifecycleStatus: booking.lifecycle_status ?? undefined,
    payments: booking.payments,
  })
  const paymentRows = booking.payments ?? []
  const portalRequests = (booking.booking_portal_requests ?? []).slice().sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  })

  return (
    <section className="section-container" style={{ maxWidth: '960px', paddingTop: '104px', paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/portal" className="inline-link">
            Back To Portal
          </Link>
          <Badge variant={toPaymentBadgeVariant(paymentStatus)} label={paymentStatus.replaceAll('_', ' ')} />
        </div>

        <div style={{ border: '1px solid var(--border)', background: 'rgba(10,10,14,0.92)', padding: '28px', display: 'grid', gap: '18px' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Booking Details</span>
            <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.05 }}>
              {booking.event_name}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.75 }}>
              {formatDateTime(booking.event_date, booking.event_timezone)}
              {booking.venue || booking.city ? ` • ${[booking.venue, booking.city].filter(Boolean).join(', ')}` : ''}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Event Type', value: booking.event_type || '—' },
              { label: 'Package', value: booking.package || '—' },
              { label: 'Quote', value: formatCurrency(booking.quote) },
              { label: 'Deposit', value: formatCurrency(booking.deposit_amount) },
              { label: 'Paid So Far', value: formatCurrency(receivedTotal) },
              { label: 'Remaining', value: formatCurrency(outstandingBalance) },
            ].map((item) => (
              <div key={item.label} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-sunken)', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--white)' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {booking.notes && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'grid', gap: '8px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--eyebrow)' }}>
                Booking Notes
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.75 }}>
                {booking.notes}
              </div>
            </div>
          )}
        </div>

        {requestError && (
          <div style={{ border: '1px solid rgba(232, 93, 117, 0.3)', background: 'rgba(232, 93, 117, 0.08)', padding: '14px 16px', color: '#fecdd3', fontSize: '13px', lineHeight: 1.6 }}>
            {requestError}
          </div>
        )}

        {requestSuccess && (
          <div style={{ border: '1px solid rgba(34, 197, 94, 0.24)', background: 'rgba(34, 197, 94, 0.08)', padding: '14px 16px', color: '#bbf7d0', fontSize: '13px', lineHeight: 1.6 }}>
            {requestSuccess}
          </div>
        )}

        <div style={{ border: '1px solid var(--border)', background: 'rgba(10,10,14,0.92)', padding: '28px', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '22px' }}>Payment Activity</h2>
            <Link href={`/pay/${booking.id}`} className="btn-primary">
              Open Payment Page
            </Link>
          </div>

          {paymentRows.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7 }}>
              No payments have been recorded yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {paymentRows.map((payment, index) => (
                <div key={`${payment.type}-${payment.paid_at ?? index}`} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-sunken)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <div style={{ color: 'var(--white)', fontSize: '14px', textTransform: 'capitalize' }}>
                      {payment.type} payment
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                      {payment.method || 'method pending'} • {formatShortDate(payment.paid_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '15px' }}>
                      {formatCurrency(payment.amount)}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'capitalize' }}>
                      {payment.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ border: '1px solid var(--border)', background: 'rgba(10,10,14,0.92)', padding: '28px', display: 'grid', gap: '18px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <h2 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '22px' }}>Request An Update</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.75, margin: 0 }}>
              Use this form if you need to change event details or discuss a cancellation. I&apos;ll review the request and follow up directly.
            </p>
          </div>

          <form action={submitPortalBookingRequestAction} style={{ display: 'grid', gap: '14px' }}>
            <input type="hidden" name="booking_id" value={booking.id} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="section-label" style={{ marginBottom: 0 }}>Request Type</span>
                <select
                  name="request_type"
                  defaultValue="update"
                  style={{ width: '100%', background: 'var(--bg-sunken)', border: '1px solid var(--border)', color: 'var(--white)', padding: '12px 14px', fontSize: '14px' }}
                >
                  <option value="update">Update Request</option>
                  <option value="cancellation">Cancellation Request</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="section-label" style={{ marginBottom: 0 }}>Best Follow-Up Method</span>
                <select
                  name="preferred_contact"
                  defaultValue={client.phone ? 'phone' : 'email'}
                  style={{ width: '100%', background: 'var(--bg-sunken)', border: '1px solid var(--border)', color: 'var(--white)', padding: '12px 14px', fontSize: '14px' }}
                >
                  <option value="phone">Text Or Call Me</option>
                  <option value="email">Email Me</option>
                </select>
              </label>
            </div>

            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>What Do You Need?</span>
              <textarea
                name="message"
                rows={5}
                minLength={12}
                required
                placeholder="Share the change you need, the new details, or anything else I should know."
                style={{ width: '100%', background: 'var(--bg-sunken)', border: '1px solid var(--border)', color: 'var(--white)', padding: '14px', fontSize: '14px', lineHeight: 1.7, resize: 'vertical' }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                A request does not change your booking automatically. I&apos;ll review it first.
              </p>
              <button type="submit" className="btn-primary">
                Send Request
              </button>
            </div>
          </form>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px', display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '16px' }}>Recent Requests</h3>
              <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                {portalRequests.length === 0 ? 'No requests sent yet' : `${portalRequests.length} request${portalRequests.length === 1 ? '' : 's'} on file`}
              </div>
            </div>

            {portalRequests.length === 0 ? (
              <div style={{ border: '1px dashed rgba(255,255,255,0.16)', padding: '16px 18px', color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7 }}>
                You have not sent any booking change requests yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {portalRequests.map((request) => (
                  <div key={request.id} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-sunken)', padding: '16px', display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'grid', gap: '4px' }}>
                        <div style={{ color: 'var(--white)', fontSize: '14px', textTransform: 'capitalize' }}>
                          {request.type} request
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                          Sent {formatShortDate(request.created_at)}
                          {request.preferred_contact ? ` • Follow up by ${request.preferred_contact}` : ''}
                        </div>
                      </div>
                      <Badge
                        variant={toPortalRequestBadgeVariant(request.status)}
                        label={request.status === 'resolved' ? 'resolved' : request.status === 'reviewed' ? 'in review' : 'new'}
                      />
                    </div>
                    <div style={{ color: 'var(--white)', fontSize: '13px', lineHeight: 1.75 }}>
                      {request.message}
                    </div>
                    {request.resolved_at && (
                      <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                        Resolved {formatShortDate(request.resolved_at)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
