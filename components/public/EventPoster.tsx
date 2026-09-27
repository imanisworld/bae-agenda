import Image from 'next/image'
import type { Event } from '@/lib/db/events'
import { isValidTimeZone } from '@/lib/date-time'
import styles from './EventPoster.module.css'

function parts(event: Event) {
  const validZone = event.event_timezone && isValidTimeZone(event.event_timezone)
  const timeZone = validZone ? event.event_timezone! : 'UTC'
  const date = new Date(event.event_date)

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(date)

  const timeLabel = validZone
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone,
      }).format(date)
    : null

  return { dateLabel, timeLabel }
}

export default function EventPoster({ event, priority = false }: { event: Event; priority?: boolean }) {
  const { dateLabel, timeLabel } = parts(event)
  const location = [event.venue, event.city].filter(Boolean).join(' · ')

  return (
    <article className={styles.poster}>
      <Image
        src="/photos/PlexMix19-DJBAE.JPEG"
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 760px) 100vw, 1100px"
        className={styles.image}
        aria-hidden="true"
      />
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.topline}>
        <span>Upcoming Event</span>
        {event.featured ? <span className={styles.status}>Featured</span> : null}
      </div>

      <div className={styles.info}>
        <p className={styles.date}>{dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}</p>
        <h3>{event.title}</h3>
        {location ? <p className={styles.location}>{location}</p> : null}
        {event.show_description && event.description ? (
          <p className={styles.description}>{event.description}</p>
        ) : null}
      </div>
    </article>
  )
}
