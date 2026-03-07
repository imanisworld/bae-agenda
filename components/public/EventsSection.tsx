/**
 * EVENTS SECTION — Async Server Component
 * Fetches the next 3 upcoming public events from Supabase.
 * Shows an empty state if no events are scheduled.
 * Hover states via CSS classes — no JS event handlers.
 */
import Link from 'next/link'
import { getFeaturedEvents, type Event } from '@/lib/db/events'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEventDate(isoDate: string): { day: string; month: string } {
  const d = new Date(isoDate)
  return {
    day:   d.toLocaleString('en-US', { day: '2-digit',   timeZone: 'America/Chicago' }),
    month: d.toLocaleString('en-US', { month: 'short',   timeZone: 'America/Chicago' }).toUpperCase(),
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EventRow({ title, event_date, venue, city, featured }: Event) {
  const { day, month } = formatEventDate(event_date)
  const locationParts  = [venue, city].filter(Boolean).join(' · ')

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '80px 1fr auto',
      alignItems: 'center', gap: '32px',
      padding: '28px 0', borderBottom: '1px solid var(--border)',
    }}>
      {/* Date */}
      <div>
        <div style={{
          fontFamily: 'Conthrax, sans-serif', fontSize: '28px',
          fontWeight: 600, color: 'var(--white)', lineHeight: 1,
        }}>
          {day}
        </div>
        <div style={{
          fontSize: '9px', letterSpacing: '0.2em',
          color: 'var(--muted)', textTransform: 'uppercase', marginTop: '4px',
        }}>
          {month}
        </div>
      </div>

      {/* Info */}
      <div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '15px',
          fontWeight: 400, color: 'var(--white)', marginBottom: '4px',
        }}>
          {title}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
          {locationParts || 'Location TBA'}

          {featured && (
            <span style={{
              marginLeft: '8px', fontSize: '8px', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--violet)',
              border: '1px solid rgba(155,93,229,0.3)', padding: '2px 6px',
            }}>
              Featured
            </span>
          )}
        </div>
      </div>

      {/* Arrow — hover via CSS class */}
      <Link href="/events" aria-label={`Details for ${title}`} className="event-arrow">
        →
      </Link>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      padding: '64px 0', textAlign: 'center',
      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
    }}>
      <p style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.04em', lineHeight: 1.7 }}>
        No upcoming events scheduled yet.
        <br />
        Follow on{' '}
        <a
          href="https://www.instagram.com/dj_b.a.e/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link"
        >
          Instagram
        </a>
        {' '}for announcements.
      </p>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export default async function EventsSection() {
  const events = await getFeaturedEvents()

  return (
    <section id="events" aria-label="Upcoming Events" style={{
      background: 'var(--black)', borderTop: '1px solid var(--border)',
    }}>
      <div className="section-container">

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <span className="section-label">Events</span>
            <h2 className="section-heading" style={{ marginBottom: 0 }}>Upcoming Dates</h2>
          </div>
          <Link href="/events" className="view-all-link" style={{ marginBottom: '10px' }}>
            See All Events →
          </Link>
        </div>

        <div aria-hidden="true" style={{
          height: '1px', background: 'var(--border)', margin: '32px 0 0',
        }} />

        {/* Event list or empty state */}
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          <div role="list">
            {events.map((event) => (
              <div key={event.id} role="listitem">
                <EventRow {...event} />
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <p style={{
          marginTop: '32px', fontSize: '12px',
          color: 'var(--muted)', letterSpacing: '0.04em', lineHeight: 1.6,
        }}>
          Follow on{' '}
          <a
            href="https://www.instagram.com/dj_b.a.e/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            Instagram
          </a>
          {' '}for last-minute announcements and pop-up sets.
        </p>

      </div>
    </section>
  )
}
