/**
 * ADMIN — BOOKINGS
 * Full bookings table with status badges. Data fetched server-side.
 */
import PageHeader      from '@/components/admin/PageHeader'
import Badge           from '@/components/admin/Badge'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminNotice     from '@/components/admin/AdminNotice'
import { createEventFromBookingAction, updateBookingStatusAction } from '@/app/actions/bookings'
import { createClient } from '@/lib/supabase/server'
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
  status:      BookingStatus
  created_at:  string
}

interface BookingQueryRow {
  id: string
  event_name: string
  event_date: string
  event_timezone: string
  venue: string | null
  city: string | null
  package: string | null
  status: BookingStatus
  created_at: string
  clients: { first_name: string | null; last_name: string | null } | null
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

async function getBookings(): Promise<BookingRow[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('bookings')
      .select('id, event_name, event_date, event_timezone, venue, city, package, status, created_at, clients(first_name, last_name)')
      .order('created_at', { ascending: false })
    const rows = (data ?? []) as BookingQueryRow[]
    return rows.map((b) => ({
      id:          b.id,
      event_name:  b.event_name,
      event_date:  b.event_date,
      event_timezone: b.event_timezone,
      venue:       b.venue,
      city:        b.city,
      client_name: b.clients
        ? `${b.clients.first_name ?? ''} ${b.clients.last_name ?? ''}`.trim() || null
        : null,
      package:    b.package,
      status:     b.status as BookingStatus,
      created_at: b.created_at,
    }))
  } catch {
    return []
  }
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  if (!errorParam) return null
  return Array.isArray(errorParam) ? errorParam[0] ?? null : errorParam
}

function getBookingActions(status: BookingStatus) {
  if (status === 'inquiry') {
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

function canCreateEvent(status: BookingStatus) {
  return status === 'confirmed' || status === 'completed'
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>
}) {
  const bookings = await getBookings()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolvedSearchParams?.error)

  return (
    <div className="admin-page">
      <PageHeader
        title="Bookings"
        subtitle={bookings.length ? `${bookings.length} total` : undefined}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">All Bookings</span>
        </div>

        {bookings.length === 0 ? (
          <AdminEmptyState
            title="No bookings yet"
            desc="Booking requests submitted through the site will appear here."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Client</th>
                  <th>Event Date</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td data-label="Event" style={{ fontWeight: 400 }}>
                      {b.event_name}
                      {(b.venue || b.city) && (
                        <div className="muted" style={{ marginTop: '4px' }}>
                          {[b.venue, b.city].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td data-label="Client" className="muted">{b.client_name ?? '—'}</td>
                    <td data-label="Event Date" className="muted">
                      {fmtEventDate(b.event_date, b.event_timezone)}
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        {fmtEventTime(b.event_date, b.event_timezone)} · {b.event_timezone}
                      </div>
                    </td>
                    <td data-label="Package" className="muted">{b.package ?? '—'}</td>
                    <td data-label="Status"><Badge variant={b.status} /></td>
                    <td data-label="Submitted" className="muted">{fmtSubmittedDate(b.created_at)}</td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {getBookingActions(b.status).map((action) => (
                          <form key={action.nextStatus} action={updateBookingStatusAction}>
                            <input type="hidden" name="id" value={b.id} />
                            <input type="hidden" name="next_status" value={action.nextStatus} />
                            <button
                              type="submit"
                              className={action.tone === 'primary' ? 'admin-btn-primary' : 'admin-btn-ghost'}
                              style={
                                action.tone === 'danger'
                                  ? {
                                      color: '#e85d75',
                                      borderColor: 'rgba(232,93,117,0.35)',
                                    }
                                  : action.tone === 'primary'
                                    ? { padding: '7px 14px' }
                                    : undefined
                              }
                            >
                              {action.label}
                            </button>
                          </form>
                        ))}
                        {canCreateEvent(b.status) && (
                          <form action={createEventFromBookingAction}>
                            <input type="hidden" name="booking_id" value={b.id} />
                            <button type="submit" className="admin-btn-ghost">
                              Create Event
                            </button>
                          </form>
                        )}
                        <Link href={`/admin/bookings/${b.id}`} className="admin-view-all" style={{ alignSelf: 'center' }}>
                          Edit →
                        </Link>
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
