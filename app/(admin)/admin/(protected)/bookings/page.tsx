/**
 * ADMIN — BOOKINGS
 * Full bookings table with status badges. Data fetched server-side.
 */
import PageHeader      from '@/components/admin/PageHeader'
import Badge           from '@/components/admin/Badge'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminNotice     from '@/components/admin/AdminNotice'
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton'
import { createEventFromBookingAction, updateBookingStatusAction } from '@/app/actions/bookings'
import { getPrimaryBookingClient } from '@/lib/booking-client'
import { getDepositStatus } from '@/lib/booking-deposit'
import { getBookingLifecycleStatus, getBookingWorkflowPaymentStatus, type BookingLifecycleStatus, type BookingWorkflowPaymentStatus } from '@/lib/booking-workflow'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { BOOKING_LIFECYCLE_STATUS_LABELS, BOOKING_WORKFLOW_PAYMENT_STATUS_LABELS } from '@/lib/constants'
import type { BookingStatus } from '@/types/index'
import Link from 'next/link'

interface BookingRow {
  id:          string
  event_name:  string
  event_date:  string
  event_timezone: string
  venue:       string | null
  city:        string | null
  client_name: string | null
  package:     string | null
  status:      BookingLifecycleStatus
  payment_status: BookingWorkflowPaymentStatus
  deposit_status: 'unpaid' | 'pending' | 'paid'
  linked_event_id: string | null
  created_at:  string
}

interface EventLinkRow {
  id: string
  booking_id: string | null
}

interface BookingQueryRow {
  id: string
  event_name: string
  event_date: string
  event_timezone: string
  venue: string | null
  city: string | null
  package: string | null
  quote: number | null
  deposit_amount: number | null
  status: BookingStatus
  lifecycle_status: BookingLifecycleStatus | null
  payment_status: BookingWorkflowPaymentStatus | null
  created_at: string
  clients: { first_name: string | null; last_name: string | null; email: string | null }[] | null
  payments: { amount: number; status: 'pending' | 'received' | 'refunded' }[] | null
}

function fmtEventDate(iso: string, timeZone: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone,
  })
}

function fmtEventTime(iso: string, timeZone: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  })
}

function fmtSubmittedDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Indiana/Indianapolis',
  })
}

function getCompactPaymentLabel(status: BookingWorkflowPaymentStatus) {
  switch (status) {
    case 'deposit_requested':
      return 'Deposit Req'
    case 'deposit_paid':
      return 'Deposit Paid'
    case 'balance_requested':
      return 'Balance Req'
    default:
      return BOOKING_WORKFLOW_PAYMENT_STATUS_LABELS[status]
  }
}

function getCompactDepositLabel(status: 'unpaid' | 'pending' | 'paid') {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

async function getBookings(): Promise<BookingRow[]> {
  try {
    const supabase = createClient()
    const [{ data, error: bookingsError }, { data: eventRows, error: eventsError }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, event_name, event_date, event_timezone, venue, city, package, quote, deposit_amount, status, lifecycle_status, payment_status, created_at, clients(first_name, last_name, email), payments(amount, type, status)')
        .order('created_at', { ascending: false }),
      supabase
        .from('events')
        .select('id, booking_id')
        .not('booking_id', 'is', null),
    ])
    if (bookingsError || eventsError) {
      throw new Error(bookingsError?.message || eventsError?.message || 'Unable to load bookings.')
    }

    const rows = (data ?? []) as BookingQueryRow[]
    const linkedEventByBooking = new Map(
      ((eventRows ?? []) as EventLinkRow[])
        .filter((event) => event.booking_id)
        .map((event) => [event.booking_id as string, event.id] as const)
    )

    return rows.map((b) => {
      const client = getPrimaryBookingClient(b.clients)
      const lifecycleStatus = getBookingLifecycleStatus(b.lifecycle_status, b.status)
      return {
        id:          b.id,
        event_name:  b.event_name,
        event_date:  b.event_date,
        event_timezone: b.event_timezone,
        venue:       b.venue,
        city:        b.city,
        client_name: client
          ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || null
          : null,
        package:    b.package,
        status:     lifecycleStatus,
        payment_status: getBookingWorkflowPaymentStatus({
          quote: b.quote,
          depositAmount: b.deposit_amount,
          lifecycleStatus,
          payments: b.payments as Array<{ amount: number; type: string; status: 'pending' | 'received' | 'refunded' }> | null,
        }),
        deposit_status: getDepositStatus(b.deposit_amount, b.payments as Array<{ amount: number; type: string; status: 'pending' | 'received' | 'refunded' }> | null),
        linked_event_id: linkedEventByBooking.get(b.id) ?? null,
        created_at: b.created_at,
      }
    })
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to load bookings.')
  }
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  if (!errorParam) return null
  return Array.isArray(errorParam) ? errorParam[0] ?? null : errorParam
}

// Status filter chips — "in_progress" groups the two mid-pipeline statuses.
const BOOKING_FILTERS = [
  { key: 'all',         label: 'All',         matches: () => true },
  { key: 'new',         label: 'New',         matches: (s: BookingLifecycleStatus) => s === 'new' },
  { key: 'in_progress', label: 'In Progress', matches: (s: BookingLifecycleStatus) => s === 'contacted' || s === 'negotiating' },
  { key: 'confirmed',   label: 'Confirmed',   matches: (s: BookingLifecycleStatus) => s === 'confirmed' },
  { key: 'completed',   label: 'Completed',   matches: (s: BookingLifecycleStatus) => s === 'completed' },
  { key: 'lost',        label: 'Lost',        matches: (s: BookingLifecycleStatus) => s === 'lost' },
] as const

type BookingFilterKey = (typeof BOOKING_FILTERS)[number]['key']

function resolveFilter(filterParam: string | string[] | undefined): BookingFilterKey {
  const value = Array.isArray(filterParam) ? filterParam[0] : filterParam
  return BOOKING_FILTERS.some((f) => f.key === value) ? (value as BookingFilterKey) : 'all'
}

function getBookingActions(status: BookingLifecycleStatus) {
  if (status === 'new' || status === 'contacted' || status === 'negotiating') {
    return [
      { label: 'Confirm', nextStatus: 'confirmed' as const, tone: 'primary' as const },
      { label: 'Cancel', nextStatus: 'cancelled' as const, tone: 'danger' as const },
    ]
  }

  if (status === 'confirmed') {
    return [
      { label: 'Complete', nextStatus: 'completed' as const, tone: 'primary' as const },
      { label: 'Cancel', nextStatus: 'cancelled' as const, tone: 'danger' as const },
    ]
  }

  if (status === 'completed') {
    return [
      { label: 'Mark Confirmed', nextStatus: 'confirmed' as const, tone: 'ghost' as const },
    ]
  }

  return [
    { label: 'Reopen Inquiry', nextStatus: 'inquiry' as const, tone: 'ghost' as const },
  ]
}

function canCreateEvent(status: BookingLifecycleStatus) {
  return status === 'confirmed' || status === 'completed'
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[]; filter?: string | string[] }>
}) {
  const bookings = await getBookings()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolvedSearchParams?.error)
  const activeFilter = resolveFilter(resolvedSearchParams?.filter)
  const activeMatcher = BOOKING_FILTERS.find((f) => f.key === activeFilter) ?? BOOKING_FILTERS[0]
  const visibleBookings = bookings.filter((b) => activeMatcher.matches(b.status))
  const newInquiryCount = bookings.filter((booking) => booking.status === 'new').length
  const activeFollowUpCount = bookings.filter((booking) => booking.status === 'contacted' || booking.status === 'negotiating').length
  const paymentAttentionCount = bookings.filter(
    (booking) => booking.status === 'confirmed' && booking.payment_status !== 'paid'
  ).length
  const readyToScheduleCount = bookings.filter(
    (booking) =>
      (booking.status === 'confirmed' || booking.status === 'completed') &&
      !booking.linked_event_id
  ).length

  return (
    <div className="admin-page">
      <PageHeader
        title="Bookings"
        subtitle={bookings.length ? `${bookings.length} total` : undefined}
        action={{ label: 'New Booking', href: '/admin/bookings/new' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      {bookings.length > 0 && (
        <div className="admin-ops-grid">
          {[
            { label: 'New Inquiries', value: String(newInquiryCount), hint: 'Fresh requests waiting for first response' },
            { label: 'Active Follow-Up', value: String(activeFollowUpCount), hint: 'Conversations still in motion' },
            { label: 'Payment Attention', value: String(paymentAttentionCount), hint: 'Confirmed bookings not fully paid yet' },
            { label: 'Ready To Schedule', value: String(readyToScheduleCount), hint: 'Confirmed or completed event records' },
          ].map((card) => (
            <div key={card.label} className="admin-ops-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.hint}</p>
            </div>
          ))}
        </div>
      )}

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">All Bookings</span>
        </div>

        {bookings.length > 0 && (
          <nav aria-label="Filter bookings by status" className="admin-filter-chips">
            {BOOKING_FILTERS.map((f) => {
              const count = bookings.filter((b) => f.matches(b.status)).length
              const isCurrent = f.key === activeFilter
              return (
                <Link
                  key={f.key}
                  href={f.key === 'all' ? '/admin/bookings' : `/admin/bookings?filter=${f.key}`}
                  className={isCurrent ? 'admin-filter-chip admin-filter-chip-active' : 'admin-filter-chip'}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {f.label}
                  <span className="admin-filter-chip-count">{count}</span>
                </Link>
              )
            })}
          </nav>
        )}

        {bookings.length === 0 ? (
          <AdminEmptyState
            title="No bookings yet"
            desc="Booking requests from the public site and bookings you add manually will appear here."
            action={{ label: 'Create Booking', href: '/admin/bookings/new' }}
          />
        ) : visibleBookings.length === 0 ? (
          <AdminEmptyState
            title={`No ${activeMatcher.label.toLowerCase()} bookings`}
            desc="Nothing matches this filter right now."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table bookings-admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Event Date</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Deposit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map((b) => (
                  <tr key={b.id}>
                    <td data-label="Event" className="booking-event-cell">
                      <div className="booking-event-title">{b.event_name}</div>
                      <div className="booking-event-meta">
                        {b.client_name ?? 'Client pending'}
                      </div>
                      {(b.venue || b.city) && (
                        <div className="booking-event-meta">
                          {[b.venue, b.city].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      <div className="booking-event-meta">
                        {b.linked_event_id
                          ? 'Event record linked'
                          : canCreateEvent(b.status)
                            ? 'No event record linked'
                            : 'Event record available after confirmation'}
                      </div>
                      <div className="booking-event-meta booking-event-meta--mobile">
                        Submitted {fmtSubmittedDate(b.created_at)}
                      </div>
                    </td>
                    <td data-label="Event Date" className="muted booking-date-cell">
                      <div>{fmtEventDate(b.event_date, b.event_timezone)}</div>
                      <div className="booking-date-detail">
                        {fmtEventTime(b.event_date, b.event_timezone)} · {b.event_timezone}
                      </div>
                    </td>
                    <td data-label="Package" className="muted">{b.package ?? '—'}</td>
                    <td data-label="Status"><Badge variant={b.status} label={BOOKING_LIFECYCLE_STATUS_LABELS[b.status]} /></td>
                    <td data-label="Payment"><Badge variant={b.payment_status} label={getCompactPaymentLabel(b.payment_status)} /></td>
                    <td data-label="Deposit">
                      <Badge variant={b.deposit_status === 'paid' ? 'paid' : b.deposit_status === 'pending' ? 'pending' : 'unpaid'} label={getCompactDepositLabel(b.deposit_status)} />
                    </td>
                    <td data-label="Actions" className="booking-actions-cell">
                      <div className="booking-actions-inline">
                        <Link href={`/admin/bookings/${b.id}`} className="admin-btn-ghost booking-manage-link">
                          Manage
                        </Link>
                        <details className="booking-actions-menu">
                          <summary className="booking-actions-trigger" aria-label="More actions">•••</summary>
                          <div className="booking-actions-popover">
                            {getBookingActions(b.status).map((action) => {
                              const confirmationMessage =
                                action.nextStatus === 'confirmed'
                                  ? 'Confirm this booking? This can send the confirmation email and prepare the invoice draft.'
                                  : action.nextStatus === 'completed'
                                    ? 'Mark this booking complete? This can trigger the post-event follow-up.'
                                    : action.nextStatus === 'cancelled'
                                      ? 'Cancel this booking?'
                                      : null

                              return (
                                <form key={action.nextStatus} action={updateBookingStatusAction}>
                                  <input type="hidden" name="id" value={b.id} />
                                  <input type="hidden" name="next_status" value={action.nextStatus} />
                                  {confirmationMessage ? (
                                    <ConfirmSubmitButton
                                      message={confirmationMessage}
                                      className="booking-actions-item"
                                      style={
                                        action.tone === 'danger'
                                          ? { color: '#e85d75' }
                                          : undefined
                                      }
                                    >
                                      {action.label}
                                    </ConfirmSubmitButton>
                                  ) : (
                                    <button
                                      type="submit"
                                      className="booking-actions-item"
                                      style={
                                        action.tone === 'danger'
                                          ? { color: '#e85d75' }
                                          : undefined
                                      }
                                    >
                                      {action.label}
                                    </button>
                                  )}
                                </form>
                              )
                            })}
                            {b.linked_event_id ? (
                              <Link href={`/admin/events/${b.linked_event_id}`} className="booking-actions-item">
                                View Event
                              </Link>
                            ) : canCreateEvent(b.status) ? (
                              <form action={createEventFromBookingAction}>
                                <input type="hidden" name="booking_id" value={b.id} />
                                <button type="submit" className="booking-actions-item">
                                  Create Event
                                </button>
                              </form>
                            ) : null}
                            <a href={`/api/invoice/${b.id}`} download className="booking-actions-item">
                              Download PDF
                            </a>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
