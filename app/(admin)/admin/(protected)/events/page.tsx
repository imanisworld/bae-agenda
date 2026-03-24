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
import { createClient } from '@/lib/supabase/server'
import { toggleEventFeaturedAction, toggleEventPublicAction } from '@/app/actions/events'

interface EventRow {
  id:         string
  title:      string
  event_date: string
  venue:      string | null
  city:       string | null
  public:     boolean
  featured:   boolean
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/Chicago',
  })
}

function isPast(iso: string) {
  return new Date(iso) < new Date()
}

async function getEvents(): Promise<EventRow[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('events')
      .select('id, title, event_date, venue, city, public, featured')
      .order('event_date', { ascending: false })
    return (data ?? []) as EventRow[]
  } catch {
    return []
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
                      color: isPast(ev.event_date) ? 'var(--muted)' : 'var(--white)',
                    }}>
                      {ev.title}
                    </td>
                    <td data-label="Date" className="muted">{fmtDate(ev.event_date)}</td>
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
                            color: ev.featured ? 'var(--violet)' : 'var(--muted)',
                          }}
                        >
                          {ev.featured ? '★ Featured' : 'Not Featured'}
                        </button>
                      </form>
                    </td>
                    <td data-label="Actions">
                      <Link href={`/admin/events/${ev.id}`} className="admin-view-all">
                        Edit →
                      </Link>
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
