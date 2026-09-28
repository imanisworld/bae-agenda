'use client'

import { HangFrom } from '@/components/public/brand/HangingLogo'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import EventPoster from '@/components/public/EventPoster'
import type { Event } from '@/lib/db/events'

type View = 'upcoming' | 'past'

export default function EventExperienceStage({
  events,
  pastEvents = [],
}: {
  events: Event[]
  pastEvents?: Event[]
}) {
  const [view, setView] = useState<View>(events.length === 0 && pastEvents.length > 0 ? 'past' : 'upcoming')
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const list = view === 'upcoming' ? events : pastEvents
  const isPast = view === 'past'

  const goTo = useCallback((next: number) => {
    const track = trackRef.current
    const slide = track?.children[next] as HTMLElement | undefined
    if (!track || !slide) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [])

  // Keep the counter in sync with swipes: the active slide is the one nearest the track's left edge.
  function onScroll() {
    const track = trackRef.current
    if (!track) return
    let nearest = 0
    let best = Infinity
    Array.from(track.children).forEach((child, i) => {
      const distance = Math.abs((child as HTMLElement).offsetLeft - track.offsetLeft - track.scrollLeft)
      if (distance < best) {
        best = distance
        nearest = i
      }
    })
    setIndex(nearest)
  }

  function chooseView(next: View) {
    if (next === view) return
    setView(next)
    setIndex(0)
  }

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 })
  }, [view])

  function onTrackKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight' && index < list.length - 1) {
      event.preventDefault()
      goTo(index + 1)
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      goTo(index - 1)
    }
  }

  return (
    <section className="events-experience" aria-labelledby="events-stage-title">
      <div className="events-experience-head">
        <div>
          <span className="section-label">{isPast ? 'Past Events' : 'Coming Up'}</span>
          <h1 id="events-stage-title">{isPast ? 'Past ' : 'Upcoming '}<HangFrom finish="silver">E</HangFrom>vents</h1>
        </div>
        <div className="events-experience-tools">
          {pastEvents.length > 0 ? (
            <div className="events-view-switch" role="group" aria-label="Show events">
              <button type="button" aria-pressed={!isPast} onClick={() => chooseView('upcoming')}>Upcoming</button>
              <button type="button" aria-pressed={isPast} onClick={() => chooseView('past')}>Past</button>
            </div>
          ) : null}
          {list.length > 1 ? (
            <div className="events-experience-pager">
              <button
                type="button"
                className="experience-arrow"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Previous event"
              >←</button>
              <span aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}</span>
              <button
                type="button"
                className="experience-arrow"
                onClick={() => goTo(index + 1)}
                disabled={index === list.length - 1}
                aria-label="Next event"
              >→</button>
            </div>
          ) : null}
          <Link href="/book" className="btn-ghost">Book DJ B.A.E.</Link>
        </div>
      </div>

      <div className="events-experience-stage">
        {list.length > 0 ? (
          <div
            key={view}
            ref={trackRef}
            className={`events-carousel${list.length > 1 ? ' events-carousel--multi' : ''}`}
            role="region"
            aria-roledescription="carousel"
            aria-label={isPast ? 'Past events' : 'Upcoming events'}
            tabIndex={list.length > 1 ? 0 : undefined}
            onScroll={onScroll}
            onKeyDown={onTrackKeyDown}
          >
            {list.map((event, i) => (
              <div
                key={event.id}
                className="events-carousel-slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${list.length}`}
              >
                <EventPoster event={event} priority={i === 0} past={isPast} />
              </div>
            ))}
          </div>
        ) : (
          <div className="events-experience-empty">
            <span className="section-label">No dates posted</span>
            <h2>Nothing on the calendar right now.</h2>
            <Link href="/book" className="btn-primary">Book DJ B.A.E.</Link>
          </div>
        )}
      </div>
    </section>
  )
}
