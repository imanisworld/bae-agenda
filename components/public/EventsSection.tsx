/**
 * EVENTS SECTION — Async Server Component
 * Layout matches static site reference:
 *   Left  (1fr) — "— EVENTS" label + large heading + description
 *   Right (2fr) — event rows (gap: 2px) + placeholder + Instagram card + See All
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

function PlaceholderRow() {
  return (
    <div className="ev-item" style={{ opacity: 0.4 }}>
      <div>
        <span className="ev-day">?</span>
        <span className="ev-month">TBA</span>
      </div>
      <div>
        <p className="ev-name">Your Event Could Be Here</p>
        <p className="ev-venue">Your City</p>
      </div>
      <Link href="/book" className="ev-link">→</Link>
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
      <div className="section-container" style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap:                 '34px',
        alignItems:          'start',
      }}>

        {/* ── Left: label + heading + description ── */}
        <div>
          {/* "— EVENTS" eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ width: '22px', height: '1px', background: 'var(--violet)', display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--muted)' }}>
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

          {/* Event rows — 2px gap between each item */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {events.map((event) => (
              <EventRow key={event.id} {...event} />
            ))}
            <PlaceholderRow />
          </div>

          {/* Instagram card */}
          <a
            href="https://www.instagram.com/dj_b.a.e/"
            target="_blank"
            rel="noopener noreferrer"
            className="card-hover"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: '1px solid var(--border)', padding: '16px 20px', textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
                Follow for updates
              </div>
              <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '12px', fontWeight: 600, color: 'var(--white)' }}>
                @dj_b.a.e
              </div>
            </div>
            <span style={{ fontSize: '20px', color: 'var(--muted)' }}>→</span>
          </a>

          {/* See All */}
          <div>
            <Link href="/events" className="view-all-link">
              See All Events →
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
