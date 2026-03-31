import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import Badge from '@/components/admin/Badge'
import AdminNotice from '@/components/admin/AdminNotice'
import BookingPricingFields from '@/components/admin/BookingPricingFields'
import SendInvoiceButton from '@/components/admin/SendInvoiceButton'
import { formatPaymentMethodLabel, getDepositConfirmedVia, getDepositPaidAt } from '@/lib/booking-deposit'
import { getOutstandingBalance, getOutstandingDeposit, getReceivedPaymentTotal } from '@/lib/booking-finance'
import { getBookingWorkflowPaymentStatus, getBookingLifecycleStatus } from '@/lib/booking-workflow'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { confirmBookingAction, createBookingNoteAction, createBookingPaymentAction, markBookingCompleteAction, markBookingContactedAction, markBookingLostAction, markDepositReceivedAction, markFullyPaidAction, requestFinalPaymentAction, resendBookingConfirmationAction, resendBookingInquiryReceiptAction, resendBookingPostEventFollowUpAction, sendBookingBalanceReminderAction, updateBookingDetailsAction, updatePortalRequestStatusAction } from '@/app/actions/bookings'
import { confirmManualDepositAction } from '@/app/actions/deposits'
import { BOOKING_LIFECYCLE_STATUS_LABELS, BOOKING_WORKFLOW_PAYMENT_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_TYPES } from '@/lib/constants'
import type { BookingLifecycleStatus, BookingStatus, BookingWorkflowPaymentStatus } from '@/types/index'

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
  lifecycle_status: BookingLifecycleStatus | null
  payment_status: BookingWorkflowPaymentStatus | null
  payment_method: string | null
  notes: string | null
  clients: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  } | null
  payments: Array<{
    id: string
    amount: number
    type: string
    method: string | null
    status: 'pending' | 'received' | 'refunded'
    paid_at: string | null
    created_at: string
    notes: string | null
  }> | null
  booking_notes: Array<{
    id: string
    body: string
    created_at: string
  }> | null
  booking_portal_requests: Array<{
    id: string
    type: 'update' | 'cancellation'
    message: string
    preferred_contact: 'phone' | 'email' | null
    status: 'new' | 'reviewed' | 'resolved'
    resolved_at: string | null
    created_at: string
    client_id: string
  }> | null
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

function formatDateTime(iso: string) {
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

function toDateInputValue(iso: string | null) {
  if (!iso) return ''

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  return date.toISOString().slice(0, 10)
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
      lifecycle_status,
      payment_status,
      payment_method,
      notes,
      clients(id, first_name, last_name, email, phone),
      payments(id, amount, type, method, status, paid_at, created_at, notes),
      booking_notes:notes!booking_id(id, body, created_at),
      booking_portal_requests(id, type, message, preferred_contact, status, resolved_at, created_at, client_id)
    `)
    .eq('id', id)
    .maybeSingle()

  return (data as BookingDetailRow | null) ?? null
}

function getMessage(param: string | string[] | undefined) {
  if (!param) return null
  return Array.isArray(param) ? param[0] ?? null : param
}

function getPortalRequestBadgeVariant(status: 'new' | 'reviewed' | 'resolved') {
  switch (status) {
    case 'resolved':
      return 'paid'
    case 'reviewed':
      return 'pending'
    default:
      return 'unpaid'
  }
}

export default async function EditBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ error?: string | string[]; success?: string | string[] }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const booking = await getBooking(id)
  if (!booking) notFound()

  const errorMessage = getMessage(resolvedSearchParams?.error)
  const successMessage = getMessage(resolvedSearchParams?.success)

  const clientName = booking.clients
    ? `${booking.clients.first_name ?? ''} ${booking.clients.last_name ?? ''}`.trim()
    : ''
  const total = booking.quote ?? 0
  const deposit = booking.deposit_amount ?? 0
  const balance = total - deposit
  const payments = booking.payments ?? []
  const receivedTotal = getReceivedPaymentTotal(payments)
  const outstandingDeposit = getOutstandingDeposit(booking.deposit_amount, payments)
  const recordedDeposit = Math.max(deposit - outstandingDeposit, 0)
  const outstandingBalance = getOutstandingBalance(booking.quote, payments)
  const depositPaidAt = getDepositPaidAt(booking.deposit_amount, payments)
  const depositConfirmedVia = getDepositConfirmedVia(booking.deposit_amount, payments)
  const lifecycleStatus = getBookingLifecycleStatus(booking.lifecycle_status, booking.status)
  const paymentStatus = getBookingWorkflowPaymentStatus({
    currentStatus: booking.payment_status,
    quote: booking.quote,
    depositAmount: booking.deposit_amount,
    lifecycleStatus,
    payments,
  })
  const internalNotes = booking.booking_notes ?? []
  const portalRequests = (booking.booking_portal_requests ?? []).slice().sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  })
  const emailActivity = internalNotes.filter((note) => /\bemail\b/i.test(note.body)).slice(0, 4)

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Edit Booking"
        subtitle="Adjust booking details, notes, pricing, and status."
        action={{ label: 'Back To Bookings', href: '/admin/bookings' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}
      {successMessage && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.24)',
            color: '#bbf7d0',
            padding: '14px 16px',
            marginBottom: '24px',
            fontSize: '12px',
            lineHeight: 1.6,
          }}
        >
          {successMessage}
        </div>
      )}

      <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
          <Badge variant={lifecycleStatus} label={BOOKING_LIFECYCLE_STATUS_LABELS[lifecycleStatus]} />
          <Badge variant={paymentStatus} />
          {clientName && <span style={{ color: 'var(--white)', fontSize: '14px' }}>{clientName}</span>}
          {booking.clients?.email && <span className="muted">{booking.clients.email}</span>}
          {booking.clients?.phone && <span className="muted">{booking.clients.phone}</span>}
        </div>
      </div>

      {lifecycleStatus !== 'completed' && lifecycleStatus !== 'lost' && (
        <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
          <div className="admin-section-title" style={{ marginBottom: '14px' }}>Next Step</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>

            {(lifecycleStatus === 'new') && (
              <form action={markBookingContactedAction}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <button type="submit" className="admin-btn-ghost">Mark Contacted</button>
              </form>
            )}

            {(lifecycleStatus === 'new' || lifecycleStatus === 'contacted' || lifecycleStatus === 'negotiating') && (
              <form action={confirmBookingAction}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <button type="submit" className="admin-btn-primary">Confirm Booking</button>
              </form>
            )}

            {lifecycleStatus === 'confirmed' && paymentStatus === 'deposit_requested' && (
              <form action={markDepositReceivedAction}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <button type="submit" className="admin-btn-primary">Mark Deposit Received</button>
              </form>
            )}

            {lifecycleStatus === 'confirmed' && paymentStatus === 'deposit_paid' && (
              <form action={requestFinalPaymentAction}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <button type="submit" className="admin-btn-primary">Request Final Payment</button>
              </form>
            )}

            {lifecycleStatus === 'confirmed' && paymentStatus === 'balance_requested' && (
              <form action={markFullyPaidAction}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <button type="submit" className="admin-btn-primary">Mark Fully Paid</button>
              </form>
            )}

            {lifecycleStatus === 'confirmed' && paymentStatus === 'paid' && (
              <form action={markBookingCompleteAction}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <button type="submit" className="admin-btn-primary">Mark Complete</button>
              </form>
            )}

            <form action={markBookingLostAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button type="submit" className="admin-btn-ghost" style={{ color: '#e85d75' }}>Mark Lost</button>
            </form>
          </div>
        </div>
      )}

      <form action={updateBookingDetailsAction} className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <input type="hidden" name="id" value={booking.id} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="admin-section-title" style={{ marginBottom: '10px' }}>Booking Details & Pricing</div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
              Set the event details, quote, and deposit here before sending invoice or payment requests.
            </p>
          </div>
        </div>

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
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Lifecycle *</span>
              <select name="lifecycle_status" defaultValue={lifecycleStatus} style={inputStyle()}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="negotiating">Negotiating</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Payment Workflow *</span>
              <select name="payment_status" defaultValue={paymentStatus} style={inputStyle()}>
                <option value="unpaid">Unpaid</option>
                <option value="deposit_requested">Deposit Requested</option>
                <option value="deposit_paid">Deposit Paid</option>
                <option value="balance_requested">Balance Requested</option>
                <option value="paid">Paid</option>
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

          <BookingPricingFields
            defaultQuote={booking.quote}
            defaultDepositAmount={booking.deposit_amount}
          />

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

      <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="admin-section-title" style={{ marginBottom: '10px' }}>Client Emails</div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
              Send the lean client flow from here: inquiry receipt, booking confirmation, final payment reminder, and the post-event thank-you.
            </p>
          </div>

          <div className="admin-form-actions">
            <form action={resendBookingInquiryReceiptAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button
                type="submit"
                className="admin-btn-ghost"
                disabled={!booking.clients?.email}
                style={!booking.clients?.email ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                title={!booking.clients?.email ? 'Add a client email before sending.' : undefined}
              >
                Resend Inquiry Receipt
              </button>
            </form>
            <form action={resendBookingConfirmationAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button
                type="submit"
                className="admin-btn-ghost"
                disabled={!booking.clients?.email || (lifecycleStatus !== 'confirmed' && lifecycleStatus !== 'completed')}
                style={
                  !booking.clients?.email || (lifecycleStatus !== 'confirmed' && lifecycleStatus !== 'completed')
                    ? { opacity: 0.55, cursor: 'not-allowed' }
                    : undefined
                }
                title={
                  !booking.clients?.email
                    ? 'Add a client email before sending.'
                    : lifecycleStatus !== 'confirmed' && lifecycleStatus !== 'completed'
                      ? 'Confirm the booking first before resending the confirmation email.'
                      : undefined
                }
              >
                Resend Confirmation Email
              </button>
            </form>
            <form action={sendBookingBalanceReminderAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button
                type="submit"
                className="admin-btn-ghost"
                disabled={!booking.clients?.email || outstandingBalance <= 0}
                style={
                  !booking.clients?.email || outstandingBalance <= 0
                    ? { opacity: 0.55, cursor: 'not-allowed' }
                    : undefined
                }
                title={
                  !booking.clients?.email
                    ? 'Add a client email before sending.'
                    : outstandingBalance <= 0
                      ? 'No balance reminder is needed because the current balance is already covered.'
                      : undefined
                }
              >
                Send Final Payment Reminder
              </button>
            </form>
            <form action={resendBookingPostEventFollowUpAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <button
                type="submit"
                className="admin-btn-ghost"
                disabled={!booking.clients?.email || lifecycleStatus !== 'completed'}
                style={
                  !booking.clients?.email || lifecycleStatus !== 'completed'
                    ? { opacity: 0.55, cursor: 'not-allowed' }
                    : undefined
                }
                title={
                  !booking.clients?.email
                    ? 'Add a client email before sending.'
                    : lifecycleStatus !== 'completed'
                      ? 'Mark the booking completed before sending the post-event follow-up.'
                      : undefined
                }
              >
                Send Post-Event Follow-Up
              </button>
            </form>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div className="admin-section-title" style={{ marginBottom: '10px' }}>Recent Email Activity</div>
          {emailActivity.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
              No email activity logged for this booking yet.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {emailActivity.map((note) => (
                <div
                  key={note.id}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--bg-sunken)',
                    padding: '14px 16px',
                    display: 'grid',
                    gap: '6px',
                  }}
                >
                  <div className="muted" style={{ fontSize: '11px' }}>
                    {formatDateTime(note.created_at)}
                  </div>
                  <div style={{ color: 'var(--white)', fontSize: '13px', lineHeight: 1.6 }}>
                    {note.body}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              { label: 'Payment Status', value: BOOKING_WORKFLOW_PAYMENT_STATUS_LABELS[paymentStatus] },
              { label: 'Lifecycle', value: BOOKING_LIFECYCLE_STATUS_LABELS[lifecycleStatus] },
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
              {item.label === 'Payment Status' ? (
                <Badge variant={paymentStatus} />
              ) : item.label === 'Lifecycle' ? (
                <Badge variant={lifecycleStatus} label={BOOKING_LIFECYCLE_STATUS_LABELS[lifecycleStatus]} />
              ) : (
                <div style={{ color: item.label === 'Balance Due' ? 'var(--violet)' : 'var(--white)', fontSize: '18px', fontFamily: 'Conthrax, sans-serif' }}>
                  {item.value}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="admin-section-title" style={{ marginBottom: '10px' }}>Payment Log</div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
              Record deposits, balances, refunds, and mark whether funds are pending or received.
            </p>
          </div>

          <div style={{ minWidth: '180px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
              Received So Far
            </div>
            <div style={{ color: '#34d399', fontSize: '22px', fontFamily: 'Conthrax, sans-serif' }}>
              {formatCurrency(receivedTotal)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ border: '1px solid var(--border)', background: 'var(--bg-sunken)', padding: '16px', display: 'grid', gap: '10px' }}>
            <div className="admin-section-title">Public Deposit Link</div>
            <div className="muted" style={{ fontSize: '12px', lineHeight: 1.7 }}>
              Share this page with the client when the deposit is ready to collect.
            </div>
            <Link href={`/pay/${booking.id}`} className="admin-btn-ghost">
              Open Payment Page
            </Link>
          </div>

          <form action={confirmManualDepositAction} style={{ border: '1px solid var(--border)', background: 'var(--bg-sunken)', padding: '16px', display: 'grid', gap: '12px' }}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <div className="admin-section-title">Manual Deposit Confirm</div>
            <div className="admin-form-grid-two">
              <label style={{ display: 'grid', gap: '7px' }}>
                <span className="muted" style={{ fontSize: '12px' }}>Method</span>
                <select name="method" defaultValue="zelle" style={inputStyle()}>
                  <option value="zelle">Zelle</option>
                  <option value="cash_app">Cash App</option>
                </select>
              </label>
              <div style={{ display: 'grid', gap: '7px' }}>
                <span className="muted" style={{ fontSize: '12px' }}>Amount To Record</span>
                <div style={{ color: 'var(--white)', fontFamily: 'Conthrax, sans-serif', fontSize: '16px' }}>
                  {outstandingDeposit > 0 ? formatCurrency(outstandingDeposit) : 'Covered'}
                </div>
                <div className="muted" style={{ fontSize: '12px', lineHeight: 1.6 }}>
                  {outstandingDeposit > 0
                    ? `This records the remaining deposit gap. ${formatCurrency(recordedDeposit)} already logged, ${formatCurrency(outstandingDeposit)} left.`
                    : `The configured deposit is already covered at ${formatCurrency(deposit)}.`}
                </div>
              </div>
            </div>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="muted" style={{ fontSize: '12px' }}>Note</span>
              <textarea name="notes" rows={2} style={inputStyle()} placeholder="Receipt screenshot received, transfer confirmed..." />
            </label>
            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-btn-primary"
                disabled={outstandingDeposit <= 0}
                style={outstandingDeposit <= 0 ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
              >
                Confirm Manual Deposit
              </button>
            </div>
            {(depositPaidAt || depositConfirmedVia) && (
              <div className="muted" style={{ fontSize: '12px', lineHeight: 1.7 }}>
                {depositPaidAt ? `Last deposit update: ${formatDateTime(depositPaidAt)}.` : ''}
                {depositConfirmedVia ? ` Confirmed via ${depositConfirmedVia}.` : ''}
              </div>
            )}
          </form>
        </div>

        {payments.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '20px 0 0' }}>
            No payments logged for this booking yet.
          </p>
        ) : (
          <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
            {payments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sunken)',
                  padding: '14px 16px',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--white)', fontFamily: 'Conthrax, sans-serif', fontSize: '13px' }}>
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="muted" style={{ textTransform: 'capitalize' }}>
                      {payment.type}
                      {payment.method ? ` · ${formatPaymentMethodLabel(payment.method)}` : ''}
                    </span>
                  </div>
                  <Badge variant={payment.status} />
                </div>
                <div className="muted" style={{ fontSize: '12px' }}>
                  {payment.paid_at ? `Paid ${formatDateTime(payment.paid_at)}` : `Logged ${formatDateTime(payment.created_at)}`}
                </div>
                {payment.notes && (
                  <div style={{ color: 'var(--white)', fontSize: '13px', lineHeight: 1.6 }}>
                    {payment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form action={createBookingPaymentAction} style={{ marginTop: '20px', display: 'grid', gap: '14px' }}>
          <input type="hidden" name="booking_id" value={booking.id} />
          <div className="admin-form-grid-two">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Amount *</span>
              <input name="amount" type="number" min={0} step="1" required style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Type *</span>
              <select name="type" defaultValue="deposit" style={inputStyle()}>
                {PAYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form-grid-two-wide">
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Method</span>
              <select name="method" defaultValue="" style={inputStyle()}>
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {formatPaymentMethodLabel(method)}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Status *</span>
              <select name="status" defaultValue="received" style={inputStyle()}>
                <option value="received">Received</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Paid Date</span>
            <input name="paid_at" type="date" defaultValue={toDateInputValue(new Date().toISOString())} style={inputStyle()} />
          </label>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Payment Note</span>
            <textarea name="notes" rows={3} style={inputStyle()} placeholder="Optional receipt or transfer details" />
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary">
              Record Payment
            </button>
          </div>
        </form>
      </div>

      <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="admin-section-title" style={{ marginBottom: '10px' }}>Portal Requests</div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
              Review client-submitted update and cancellation requests from the portal. These do not auto-change the booking.
            </p>
          </div>

          <div style={{ minWidth: '180px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
              Open Requests
            </div>
            <div style={{ color: 'var(--white)', fontFamily: 'Conthrax, sans-serif', fontSize: '22px' }}>
              {portalRequests.filter((request) => request.status !== 'resolved').length}
            </div>
          </div>
        </div>

        {portalRequests.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '20px 0 0' }}>
            No client portal requests yet.
          </p>
        ) : (
          <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
            {portalRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  border: request.status === 'new' ? '1px solid rgba(212, 175, 55, 0.28)' : '1px solid var(--border)',
                  background: 'var(--bg-sunken)',
                  padding: '16px',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <div style={{ color: 'var(--white)', fontSize: '14px', textTransform: 'capitalize' }}>
                      {request.type} request
                    </div>
                    <div className="muted" style={{ fontSize: '12px', lineHeight: 1.6 }}>
                      {formatDateTime(request.created_at)}
                      {request.preferred_contact ? ` · Follow up by ${request.preferred_contact}` : ''}
                    </div>
                  </div>
                  <Badge
                    variant={getPortalRequestBadgeVariant(request.status)}
                    label={request.status === 'resolved' ? 'resolved' : request.status === 'reviewed' ? 'in review' : 'new'}
                  />
                </div>

                <div style={{ color: 'var(--white)', fontSize: '13px', lineHeight: 1.7 }}>
                  {request.message}
                </div>

                {request.resolved_at && (
                  <div className="muted" style={{ fontSize: '12px' }}>
                    Resolved {formatDateTime(request.resolved_at)}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {request.status === 'new' && (
                    <form action={updatePortalRequestStatusAction}>
                      <input type="hidden" name="booking_id" value={booking.id} />
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="status" value="reviewed" />
                      <button type="submit" className="admin-btn-ghost">Mark In Review</button>
                    </form>
                  )}

                  {request.status !== 'resolved' && (
                    <form action={updatePortalRequestStatusAction}>
                      <input type="hidden" name="booking_id" value={booking.id} />
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="status" value="resolved" />
                      <button type="submit" className="admin-btn-primary">Mark Resolved</button>
                    </form>
                  )}

                  {request.status !== 'new' && (
                    <form action={updatePortalRequestStatusAction}>
                      <input type="hidden" name="booking_id" value={booking.id} />
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="status" value="new" />
                      <button type="submit" className="admin-btn-ghost">Move Back To New</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-section" style={{ padding: '24px', marginBottom: '16px' }}>
        <div className="admin-section-title" style={{ marginBottom: '10px' }}>Internal Notes</div>
        <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
          Save internal follow-up notes here without changing the client-facing booking summary.
        </p>

        {internalNotes.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '20px 0 0' }}>
            No internal notes yet.
          </p>
        ) : (
          <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
            {internalNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sunken)',
                  padding: '14px 16px',
                }}
              >
                <div className="muted" style={{ fontSize: '11px', marginBottom: '8px' }}>
                  {formatDateTime(note.created_at)}
                </div>
                <div style={{ color: 'var(--white)', fontSize: '13px', lineHeight: 1.7 }}>
                  {note.body}
                </div>
              </div>
            ))}
          </div>
        )}

        <form action={createBookingNoteAction} style={{ marginTop: '20px', display: 'grid', gap: '14px' }}>
          <input type="hidden" name="booking_id" value={booking.id} />
          <input type="hidden" name="client_id" value={booking.clients?.id ?? ''} />
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Add Internal Note</span>
            <textarea name="body" rows={4} required style={inputStyle()} placeholder="Called client, awaiting deposit, confirmed setup details..." />
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary">
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
