/**
 * ADMIN — EVENTS
 * Full events table. Shows all events (public + private). Data fetched server-side.
 */
import PageHeader      from '@/components/admin/PageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import { createClient } from '@/lib/supabase/server'

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

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1120px' }}>
      <PageHeader
        title="Events"
        subtitle={events.length ? `${events.length} total` : undefined}
      />

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
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>City</th>
                  <th>Visibility</th>
                  <th>Featured</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td style={{
                      fontWeight: 400,
                      color: isPast(ev.event_date) ? 'var(--muted)' : 'var(--white)',
                    }}>
                      {ev.title}
                    </td>
                    <td className="muted">{fmtDate(ev.event_date)}</td>
                    <td className="muted">{ev.venue ?? '—'}</td>
                    <td className="muted">{ev.city  ?? '—'}</td>
                    <td>
                      <span style={{
                        fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: ev.public ? '#34d399' : 'var(--muted)',
                      }}>
                        {ev.public ? 'Public' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      {ev.featured && (
                        <span style={{
                          fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase',
                          color: 'var(--violet)',
                        }}>
                          ★ Featured
                        </span>
                      )}
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
