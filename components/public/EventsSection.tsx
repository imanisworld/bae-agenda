import Link from 'next/link'
import { getFeaturedEvents } from '@/lib/db/events'
import EventPoster from '@/components/public/EventPoster'

export default async function EventsSection() {
  const events = await getFeaturedEvents()

  return (
    <section id="events" aria-label="Upcoming Events" style={{
      background: '#0e0b0a',
      borderTop: '1px solid rgba(196,165,116,.14)',
    }}>
      <div className="section-container" style={{ paddingTop: '72px', paddingBottom: '78px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          gap: '24px',
          flexWrap: 'wrap',
          marginBottom: '30px',
        }}>
          <div>
            <span className="section-label">Future Dates</span>
            <h2 style={{
              margin: '10px 0 0',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 'clamp(54px, 8vw, 108px)',
              fontWeight: 400,
              lineHeight: .9,
              letterSpacing: '-.055em',
              color: '#f6f1e8',
            }}>
              Upcoming Events
            </h2>
          </div>
          <Link href="/events" className="view-all-link">See all dates →</Link>
        </div>

        {events.length ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {events.map((event, index) => (
              <EventPoster key={event.id} event={event} priority={index === 0} />
            ))}
          </div>
        ) : (
          <div style={{
            minHeight: '340px',
            display: 'grid',
            alignContent: 'center',
            gap: '18px',
            padding: '36px',
            border: '1px solid rgba(196,165,116,.14)',
            background: 'linear-gradient(135deg, rgba(143,45,60,.12), rgba(14,11,10,.94))',
          }}>
            <span className="section-label">No Public Dates Posted</span>
            <p style={{ margin: 0, maxWidth: '520px', color: 'var(--muted)', lineHeight: 1.7 }}>
              Check back soon or follow DJ B.A.E. for pop-up announcements.
            </p>
            <Link href="/book" className="btn-primary" style={{ justifySelf: 'start' }}>Book the next date</Link>
          </div>
        )}
      </div>
    </section>
  )
}
