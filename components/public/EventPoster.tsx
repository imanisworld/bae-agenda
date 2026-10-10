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
  'chi-chis-oct-3-2026': '/photos/flyers/chi-chis-original.jpg',
  'dy2k-sep-11-2026': '/photos/flyers/dy2k-lineup.jpg',
  'cat-calls-oct-16-2026': '/photos/flyers/cat-calls-oct-16-2026.jpg',
  'club-cunt-oct-31-2026': '/photos/flyers/club-cunt-flyer-coming-soon.svg',
  'innaspace-radio-nov-1-2026': '/photos/flyers/innaspace-radio-nov-1-2026.jpg',
  'room-to-bloom-jun-25-2026': '/photos/flyers/room-to-bloom-jun-25-2026.jpg',
}

// Hand-picked photos for events where the automatic pick doubled up.
const PHOTO_BY_SLUG: Record<string, (typeof POSTER_PHOTOS)[number]> = {
  'open-decks-oct-15-2026': POSTER_PHOTOS[1],
  '1st-annual-level-up-walkathon': POSTER_PHOTOS[0],
}

function posterPhoto(event: Event) {
  const picked = PHOTO_BY_SLUG[event.slug]
  if (picked) return picked

  let hash = 0
  for (const char of event.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return POSTER_PHOTOS[hash % POSTER_PHOTOS.length]
}

// The picture that stands for an event anywhere else (link previews, search).
export function eventArtwork(event: Event) {
  return FLYERS[event.slug] ?? posterPhoto(event).src
}

function parts(event: Event) {
  const validZone = event.event_timezone && isValidTimeZone(event.event_timezone)
  const timeZone = validZone ? event.event_timezone! : 'UTC'
  if (!event.event_date) return { dateLabel: 'Date TBA', timeLabel: null }
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
  const location = event.event_date ? [event.venue, event.city].filter(Boolean).join(' · ') : 'Location TBA'
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
        priority={priority && !flyer}
        loading={priority && !flyer ? undefined : 'lazy'}
        // Behind a flyer this copy is blurred to a wash, so a tiny one is enough.
        sizes={flyer ? '96px' : '(max-width: 760px) 90vw, 1100px'}
        quality={75}
        className={styles.image}
        style={flyer ? undefined : { objectPosition: photo.position }}
        aria-hidden="true"
      />
      <div className={styles.shade} aria-hidden="true" />
      {flyer ? (
        <div className={styles.flyer}>
          <Image
            src={flyer}
            alt={event.slug === 'club-cunt-oct-31-2026' ? `${event.title} — new flyer coming soon` : `${event.title} flyer`}
            fill
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            // Phones: list cards show the flyer at most ~250px wide; the event
            // page (h1) shows it nearly full width.
            sizes={headingLevel === 'h1' ? '(max-width: 600px) 84vw, 460px' : '(max-width: 600px) 64vw, 460px'}
            quality={90}
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
