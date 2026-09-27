import type { Metadata } from 'next'
import Link from 'next/link'
import { getUpcomingEvents } from '@/lib/db/events'
import EventPoster from '@/components/public/EventPoster'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events',
  alternates: { canonical: '/events' },
  description: 'Upcoming DJ sets, club nights, and appearances by DJ B.A.E. — Indianapolis based, available for travel.',
}

export default async function EventsPage() {
  const events = await getUpcomingEvents(50)

  return (
    <main style={{ background: '#0e0b0a', paddingTop: 'calc(var(--nav-height) + var(--safe-top))' }}>
      <div className="section-container" style={{ paddingTop: '66px', paddingBottom: '78px' }}>
        <header style={{ marginBottom: '34px' }}>
          <span className="section-label">Future Dates</span>
          <h1 style={{
            margin: '10px 0 14px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 'clamp(58px, 9vw, 118px)',
            fontWeight: 400,
            letterSpacing: '-.06em',
            lineHeight: .9,
            color: '#f6f1e8',
          }}>Upcoming Events</h1>
          <p style={{ margin: 0, maxWidth: '560px', color: 'var(--muted)', lineHeight: 1.7 }}>
            Public DJ B.A.E. dates. Verified time appears only after the event timezone has been reviewed.
          </p>
        </header>

        {events.length ? (
          <div style={{ display: 'grid', gap: '22px' }}>
            {events.map((event, index) => <EventPoster key={event.id} event={event} priority={index === 0} />)}
          </div>
        ) : (
          <div style={{ padding: '72px 0', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--muted)' }}>No public dates are posted yet.</p>
          </div>
        )}

        <div style={{ marginTop: '44px' }}>
          <Link href="/book" className="btn-primary">Booking Inquiry</Link>
        </div>
      </div>
    </main>
  )
}
