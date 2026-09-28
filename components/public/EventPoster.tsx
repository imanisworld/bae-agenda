import Image from 'next/image'
import Link from 'next/link'
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

export default function EventPoster({
  event,
  priority = false,
  past = false,
  showDetailsLink = false,
  headingLevel = 'h3',
}: {
  event: Event
  priority?: boolean
  past?: boolean
  showDetailsLink?: boolean
  headingLevel?: 'h1' | 'h3'
}) {
  const { dateLabel, timeLabel } = parts(event)
  const Heading = headingLevel
  const location = [event.venue, event.city].filter(Boolean).join(' · ')

  return (
    <article className={`${styles.poster}${past ? ` ${styles.past}` : ''}`}>
      <Image
        src="/photos/PlexMix19-DJBAE.JPEG"
        alt=""
        fill
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        sizes="(max-width: 760px) 100vw, 1100px"
        quality={95}
        className={styles.image}
        aria-hidden="true"
      />
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.topline}>
        <span>{past ? 'Past Event' : 'Upcoming Event'}</span>
        {event.featured && !past ? <span className={styles.status}>Featured</span> : null}
      </div>

      <div className={styles.info}>
        <p className={styles.date}>{dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}</p>
        <Heading>{event.title}</Heading>
        {location ? <p className={styles.location}>{location}</p> : null}
        {event.show_description && event.description ? (
          <p className={styles.description}>{event.description}</p>
        ) : null}
        {showDetailsLink ? (
          <Link href={`/events/${event.slug}`} className={styles.detailsLink}>
            Event details <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </article>
  )
}
