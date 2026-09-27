'use client'

import { useState } from 'react'
import Link from 'next/link'
import EventPoster from '@/components/public/EventPoster'
import type { Event } from '@/lib/db/events'

export default function EventExperienceStage({ events }: { events: Event[] }) {
  const [index, setIndex] = useState(0)
  const active = events[index] ?? null

  return (
    <section className="events-experience" aria-labelledby="events-stage-title">
      <div className="events-experience-head">
        <div>
          <span className="section-label">Future Dates</span>
          <h1 id="events-stage-title">Upcoming Events</h1>
        </div>
        <div className="events-experience-tools">
          {events.length > 1 ? (
            <>
              <button
                type="button"
                className="experience-arrow"
                onClick={() => setIndex((value) => (value - 1 + events.length) % events.length)}
                aria-label="Previous event"
              >←</button>
              <span>{String(index + 1).padStart(2, '0')} / {String(events.length).padStart(2, '0')}</span>
              <button
                type="button"
                className="experience-arrow"
                onClick={() => setIndex((value) => (value + 1) % events.length)}
                aria-label="Next event"
              >→</button>
            </>
          ) : null}
          <Link href="/book" className="btn-ghost">Book a date</Link>
        </div>
      </div>

      <div className="events-experience-stage">
        {active ? (
          <EventPoster event={active} priority />
        ) : (
          <div className="events-experience-empty">
            <span className="section-label">No Public Dates Posted</span>
            <h2>The next room is loading.</h2>
            <Link href="/book" className="btn-primary">Book DJ B.A.E.</Link>
          </div>
        )}
      </div>
    </section>
  )
}
