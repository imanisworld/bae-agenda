/**
 * ADMIN — EVENTS
 * Events control table with quick actions:
 * - create via /admin/events/new
 * - edit via /admin/events/[id]
 * - toggle public/featured inline
 */
import Link from 'next/link'
import PageHeader      from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminNotice     from '@/components/admin/AdminNotice'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { toggleEventFeaturedAction, toggleEventPublicAction } from '@/app/actions/events'
import { isValidTimeZone } from '@/lib/date-time'

interface EventRow {
  id:         string
  title:      string
  event_date: string
  event_timezone: string | null
  venue:      string | null
  city:       string | null
  public:     boolean
  featured:   boolean
  booking_id: string | null
}

function fmtDate(iso: string, eventTimeZone: string | null) {
  const timeZone = eventTimeZone && isValidTimeZone(eventTimeZone) ? eventTimeZone : 'UTC'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  })
}

function isPast(iso: string, eventTimeZone: string | null) {
  const now = new Date()
  if (eventTimeZone) return new Date(iso) < now

  const today = now.toLocaleDateString('en-CA', {
    timeZone: 'America/Indiana/Indianapolis',
  })
  return iso.slice(0, 10) < today
}

async function getEvents(): Promise<EventRow[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, event_timezone, venue, city, public, featured, booking_id')
      .order('event_date', { ascending: false })
    if (error) throw new Error(error.message || 'Unable to load events.')
    return (data ?? []) as EventRow[]
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to load events.')
  }
}

function getErrorMessage(errorParam: string | string[] | undefined) {
  if (!errorParam) return null
  return Array.isArray(errorParam) ? errorParam[0] ?? null : errorParam
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>
}) {
  const events = await getEvents()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(resolvedSearchParams?.error)

  return (
    <div className="admin-page">
      <PageHeader
        title="Events"
        subtitle={events.length ? `${events.length} total` : undefined}
        action={{ label: 'New Event', href: '/admin/events/new' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      <div className="admin-section" style={{ marginBottom: 0 }}>
        <div className="admin-section-header">
          <span className="admin-section-title">All Events</span>
        </div>

        {events.length === 0 ? (
          <AdminEmptyState
            title="No events yet"
            desc="Events you create will appear here and on the public site."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stack">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time Zone</th>
                  <th>Venue</th>
                  <th>City</th>
                  <th>Visibility</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td data-label="Title" style={{
                      fontWeight: 400,
                      color: isPast(ev.event_date, ev.event_timezone) ? 'var(--muted)' : 'var(--white)',
                    }}>
                      <div>{ev.title}</div>
                      <div className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                        {ev.booking_id ? 'Linked booking' : 'Standalone event'}
                      </div>
                    </td>
                    <td data-label="Date" className="muted">{fmtDate(ev.event_date, ev.event_timezone)}</td>
                    <td data-label="Time Zone" className="muted">
                      {ev.event_timezone ?? <span style={{ color: 'var(--gold)' }}>Review required</span>}
                    </td>
                    <td data-label="Venue" className="muted">{ev.venue ?? '—'}</td>
                    <td data-label="City" className="muted">{ev.city  ?? '—'}</td>
                    <td data-label="Visibility">
                      <form action={toggleEventPublicAction}>
                        <input type="hidden" name="id" value={ev.id} />
                        <input type="hidden" name="next_public" value={String(!ev.public)} />
                        <button
                          type="submit"
                          className="admin-btn-ghost"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            color: ev.public ? '#34d399' : 'var(--muted)',
                          }}
                        >
                          {ev.public ? 'Public' : 'Draft'}
                        </button>
                      </form>
                    </td>
                    <td data-label="Featured">
                      <form action={toggleEventFeaturedAction}>
                        <input type="hidden" name="id" value={ev.id} />
                        <input type="hidden" name="next_featured" value={String(!ev.featured)} />
                        <button
                          type="submit"
                          className="admin-btn-ghost"
                          style={{
                            padding: '4px 8px',
                            fontSize: '9px',
                            color: ev.featured ? 'var(--gold)' : 'var(--muted)',
                          }}
                        >
                          {ev.featured ? '★ Featured' : 'Not Featured'}
                        </button>
                      </form>
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link href={`/admin/events/${ev.id}`} className="admin-view-all">
                          Edit →
                        </Link>
                        {ev.booking_id && (
                          <Link href={`/admin/bookings/${ev.booking_id}`} className="admin-view-all">
                            View Booking →
                          </Link>
                        )}
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
