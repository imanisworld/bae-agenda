/**
 * EVENTS SECTION — Async Server Component
 * Layout matches the editorial homepage treatment without fake dates.
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
  const location       = [venue, city].filter(Boolean).join(', ')

  return (
    <div className={`ev-item${featured ? ' ev-featured' : ''}`}>
      <div>
        <span className="ev-day">{day}</span>
        <span className="ev-month">{month}</span>
      </div>
      <div>
        <p className="ev-name">{title}</p>
        <p className="ev-venue">{location || 'Location TBA'}</p>
      </div>
      <Link
        href="/events"
        aria-label={`Details for ${title}`}
        className="ev-link"
      >
        →
      </Link>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export default async function EventsSection() {
  const events = await getFeaturedEvents()
  const hasEvents = events.length > 0

  return (
    <section id="events" aria-label="Upcoming Events" style={{
      background: 'var(--black)', borderTop: '1px solid var(--border)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle background glow layer */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 30% 50%, rgba(155,93,229,0.06) 0%, transparent 55%),
                     radial-gradient(ellipse at 70% 50%, rgba(201,168,76,0.04) 0%, transparent 50%)`,
      }} />
      <div className="section-container" style={{
        position:            'relative',
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
        gap:                 '34px',
        alignItems:          'start',
      }}>

        {/* ── Left: label + heading + description ── */}
        <div>
          {/* "— EVENTS" eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ width: '22px', height: '1px', background: 'var(--violet)', display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--eyebrow)' }}>
              Events
            </span>
          </div>

          <h2 style={{
            fontFamily:    'Conthrax, sans-serif',
            fontSize:      'clamp(48px, 6vw, 80px)',
            fontWeight:    600,
            letterSpacing: '0.01em',
            color:         'var(--white)',
            lineHeight:    0.95,
            marginBottom:  '24px',
          }}>
            Upcoming<br />Dates
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '320px' }}>
            Catch DJ B.A.E. live. Follow on social for last-minute announcements and pop-up sets.
          </p>
        </div>

        {/* ── Right: event rows + Instagram + SEE ALL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {hasEvents ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {events.map((event) => (
                  <EventRow key={event.id} {...event} />
                ))}
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <div>
                  <Link href="/events" className="view-all-link">
                    See All Events →
                  </Link>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                  For last-minute announcements and pop-up sets, follow{' '}
                  <a
                    href="https://www.instagram.com/dj_b.a.e/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-link"
                  >
                    @dj_b.a.e
                  </a>
                  .
                </p>
              </div>
            </>
          ) : (
            <div
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: '22px 20px',
                display: 'grid',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
                  No Public Dates Yet
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                  Public events are not posted yet. For pop-up updates, follow Instagram. For private bookings, send an inquiry.
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                <Link href="/book" className="btn-primary">
                  Book The Next Date
                </Link>
                <a
                  href="https://www.instagram.com/dj_b.a.e/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-link"
                >
                  Follow on Instagram
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
