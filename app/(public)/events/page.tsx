/**
 * EVENTS PAGE — /events
 * Full listing of all upcoming public events.
 * Server Component — fetches live from Supabase.
 * Falls back to empty state if no events are scheduled.
 */
import type { Metadata } from 'next'
import Link              from 'next/link'
import { getUpcomingEvents } from '@/lib/db/events'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events — DJ B.A.E.',
  description: 'Upcoming DJ sets, club nights, and appearances by DJ B.A.E. in Chicago and beyond.',
}

function formatEventDate(isoDate: string) {
  const d = new Date(isoDate)
  return {
    day:      d.toLocaleString('en-US', { day: '2-digit',    timeZone: 'America/Chicago' }),
    month:    d.toLocaleString('en-US', { month: 'short',    timeZone: 'America/Chicago' }).toUpperCase(),
    weekday:  d.toLocaleString('en-US', { weekday: 'long',   timeZone: 'America/Chicago' }),
    year:     d.toLocaleString('en-US', { year:    'numeric',timeZone: 'America/Chicago' }),
    time:     d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' }),
  }
}

export default async function EventsPage() {
  const events = await getUpcomingEvents(50)

  return (
    <div style={{
      background: 'var(--black)',
      minHeight: '100vh',
      paddingTop: '68px',
    }}>
      <div className="section-container" style={{ paddingTop: 0 }}>

        {/* Header */}
        <div style={{ marginBottom: '56px' }}>
          <span className="section-label">Schedule</span>
          <h1 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(32px, 5vw, 60px)',
            fontWeight: 600,
            color: 'var(--white)',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            margin: '12px 0 20px',
          }}>
            Upcoming Dates
            <span style={{ color: 'var(--gold)' }}>.</span>
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--muted)',
            lineHeight: 1.7,
            maxWidth: '480px',
          }}>
            All upcoming public appearances. Follow on{' '}
            <a
              href="https://www.instagram.com/dj_b.a.e/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link"
            >
              Instagram
            </a>
            {' '}for last-minute announcements.
          </p>
        </div>

        {/* Divider */}
        <div aria-hidden="true" style={{
          height: '1px',
          background: 'var(--border)',
          marginBottom: 0,
        }} />

        {/* Events list */}
        {events.length === 0 ? (
          <div style={{
            padding: '80px 0',
            textAlign: 'center',
            borderBottom: '1px solid var(--border)',
          }}>
            <p style={{
              fontSize: '13px',
              color: 'var(--muted)',
              letterSpacing: '0.04em',
              lineHeight: 1.7,
            }}>
              No upcoming events scheduled yet.
              <br />
              Check back soon — or follow on{' '}
              <a
                href="https://www.instagram.com/dj_b.a.e/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-link"
              >
                Instagram
              </a>
              {' '}for updates.
            </p>
          </div>
        ) : (
          <div role="list">
            {events.map((event) => {
              const { day, month, weekday, year } = formatEventDate(event.event_date)
              const location = [event.venue, event.city].filter(Boolean).join(' · ')

              return (
                <div
                  key={event.id}
                  role="listitem"
                  className="public-event-row"
                >
                  {/* Date block */}
                  <div>
                    <div style={{
                      fontFamily: 'Conthrax, sans-serif',
                      fontSize: '36px',
                      fontWeight: 600,
                      color: 'var(--white)',
                      lineHeight: 1,
                    }}>
                      {day}
                    </div>
                    <div style={{
                      fontSize: '9px',
                      letterSpacing: '0.2em',
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      marginTop: '6px',
                    }}>
                      {month} {year}
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{
                      fontSize: '10px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      marginBottom: '8px',
                    }}>
                      {weekday}
                      {event.featured && (
                        <span style={{
                          marginLeft: '12px',
                          color: 'var(--violet)',
                          border: '1px solid rgba(155,93,229,0.3)',
                          padding: '2px 7px',
                          fontSize: '8px',
                        }}>
                          Featured
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '17px',
                      fontWeight: 400,
                      color: 'var(--white)',
                      marginBottom: '6px',
                    }}>
                      {event.title}
                    </div>
                    {location && (
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--muted)',
                        letterSpacing: '0.03em',
                      }}>
                        {location}
                      </div>
                    )}
                    {event.description && (
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--muted)',
                        marginTop: '8px',
                        lineHeight: 1.6,
                        maxWidth: '520px',
                      }}>
                        {event.description}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <span
                    aria-hidden="true"
                    className="event-arrow public-event-arrow"
                    style={{ pointerEvents: 'none' }}
                  >
                    →
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div style={{
          padding: '64px 0 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '20px',
        }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--muted)',
            lineHeight: 1.7,
          }}>
            Want to book a private event or collaborate?
          </p>
          <Link href="/book" className="btn-primary">
            Start Booking Request
          </Link>
        </div>

      </div>
    </div>
  )
}
