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
      display: 'grid',
      gridTemplateColumns: '120px 1fr auto',
      alignItems: 'center',
      gap: '28px',
      padding: '26px 30px',
      borderBottom: '1px solid var(--border)',
      background: featured ? 'rgba(155,93,229,0.06)' : 'transparent',
    }}>
      {/* Date */}
      <div>
        <div style={{
          fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(34px, 3.8vw, 52px)',
          fontWeight: 600, color: '#a66bff', lineHeight: 0.9,
        }}>
          {day}
        </div>
        <div style={{
          fontSize: '11px', letterSpacing: '0.22em',
          color: 'var(--muted)', textTransform: 'uppercase', marginTop: '4px',
        }}>
          {month}
        </div>
      </div>

      {/* Info */}
      <div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(22px, 2.4vw, 39px)',
          fontWeight: 600, color: 'var(--white)', marginBottom: '4px',
          letterSpacing: '0.01em',
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
      <Link href="/events" aria-label={`Details for ${title}`} className="event-arrow" style={{ fontSize: '36px', color: featured ? '#a66bff' : 'var(--muted)' }}>
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
      <div className="section-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '34px', alignItems: 'start' }}>

        {/* Header */}
        <div>
          <div>
            <span className="section-label">Events</span>
            <h2 className="section-heading" style={{ marginBottom: '22px', fontSize: 'clamp(52px, 7vw, 110px)', lineHeight: 0.93 }}>
              Upcoming<br />Dates
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '320px' }}>
            Catch DJ B.A.E. live. Follow on social for last-minute announcements and pop-up sets.
          </p>
        </div>

        <div>
          <div style={{ border: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(12,12,12,0.98), rgba(8,8,8,0.98))' }}>
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
          </div>
          <div style={{ marginTop: '18px' }}>
            <Link href="/events" className="view-all-link">
              See All Events →
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
