import Image from 'next/image'
import Link from 'next/link'
import { HangingLogo } from '@/components/public/brand/HangingLogo'
import type { Event } from '@/lib/db/events'
import { isValidTimeZone } from '@/lib/date-time'
import styles from './EventPoster.module.css'

// Events have no photo of their own, so each one gets a performance shot from
// this set, picked from its id so it stays the same on every page.
const POSTER_PHOTOS = [
  { src: '/photos/PlexMix19-DJBAE.JPEG', position: 'center 34%' },
  { src: '/photos/events/film-decks.jpg', position: 'center 30%' },
  { src: '/photos/IMG_5556.jpg', position: 'center 42%' },
  { src: '/photos/events/duo-decks.jpg', position: '74% 40%' },
  { src: '/photos/events/outdoor-smile.jpg', position: 'center 28%' },
] as const

// Flyers for specific events, keyed by slug. These show whole, beside the
// event info, instead of the rotating photo.
const FLYERS: Record<string, string> = {
  'chi-chis-oct-3-2026': '/photos/flyers/chi-chis.jpg',
  'dy2k-sep-11-2026': '/photos/flyers/dy2k-lineup.jpg',
}

function posterPhoto(event: Event) {
  let hash = 0
  for (const char of event.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return POSTER_PHOTOS[hash % POSTER_PHOTOS.length]
}

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
  onArchiveClick,
  mediaCount = 0,
  showHangingLogo = false,
}: {
  event: Event
  priority?: boolean
  past?: boolean
  showDetailsLink?: boolean
  headingLevel?: 'h1' | 'h3'
  onArchiveClick?: () => void
  mediaCount?: number
  showHangingLogo?: boolean
}) {
  const { dateLabel, timeLabel } = parts(event)
  const Heading = headingLevel
  const location = [event.venue, event.city].filter(Boolean).join(' · ')
  const photo = posterPhoto(event)
  const flyer = FLYERS[event.slug]

  return (
    <article
      className={`${styles.poster}${past ? ` ${styles.past}` : ''}${onArchiveClick ? ` ${styles.archiveReady}` : ''}${flyer ? ` ${styles.hasFlyer}` : ''}`}
    >
      <Image
        src={flyer ?? photo.src}
        alt=""
        fill
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        sizes="(max-width: 760px) 100vw, 1100px"
        quality={95}
        className={styles.image}
        style={flyer ? undefined : { objectPosition: photo.position }}
        aria-hidden="true"
      />
      <div className={styles.shade} aria-hidden="true" />
      {flyer ? (
        <div className={styles.flyer}>
          <Image
            src={flyer}
            alt={`${event.title} flyer`}
            fill
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            sizes="(max-width: 600px) 80vw, 460px"
            quality={95}
          />
        </div>
      ) : null}
      {showHangingLogo ? (
        <HangingLogo finish="silver" className={styles.posterTag} />
      ) : null}
      {onArchiveClick ? (
        <button
          type="button"
          className={styles.archiveHitArea}
          onClick={onArchiveClick}
          aria-label={`Open media archive for ${event.title}`}
        />
      ) : null}

      <div className={styles.info}>
        <p className={styles.date}>{dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}</p>
        <Heading>{event.title}</Heading>
        {location ? <p className={styles.location}>{location}</p> : null}
        {event.show_description && event.description ? (
          <p className={styles.description}>{event.description}</p>
        ) : null}
        {onArchiveClick ? (
          <button
            type="button"
            className={styles.archiveButton}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation()
              onArchiveClick()
            }}
          >
            {mediaCount > 0 ? `View media · ${mediaCount}` : 'Open media archive'}
          </button>
        ) : null}
        {showDetailsLink ? (
          <Link
            href={`/events/${event.slug}`}
            className={styles.detailsLink}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            Event details <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </article>
  )
}
