'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Event, EventMedia } from '@/lib/db/events'
import { isValidTimeZone } from '@/lib/date-time'
import styles from './EventMediaLightbox.module.css'

function eventMeta(event: Event) {
  const validZone = event.event_timezone && isValidTimeZone(event.event_timezone)
  const timeZone = validZone ? event.event_timezone! : 'UTC'
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(new Date(event.event_date))
  const location = [event.venue, event.city].filter(Boolean).join(' · ')

  return [date, location].filter(Boolean).join(' · ')
}

export default function EventMediaLightbox({
  event,
  media,
  onClose,
}: {
  event: Event
  media: EventMedia[]
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const current = media[index] ?? null

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus()
    }
  }, [event.id])

  const canStep = media.length > 1
  const titleId = useMemo(() => `event-media-title-${event.id}`, [event.id])

  useEffect(() => {
    function onKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === 'Escape') {
        keyEvent.preventDefault()
        onClose()
      } else if (canStep && keyEvent.key === 'ArrowRight') {
        keyEvent.preventDefault()
        setIndex((value) => (value + 1) % media.length)
      } else if (canStep && keyEvent.key === 'ArrowLeft') {
        keyEvent.preventDefault()
        setIndex((value) => (value - 1 + media.length) % media.length)
      } else if (keyEvent.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (keyEvent.shiftKey && document.activeElement === first) {
          keyEvent.preventDefault()
          last.focus()
        } else if (!keyEvent.shiftKey && document.activeElement === last) {
          keyEvent.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canStep, media.length, onClose])

  // Portal to <body>: the page stage is a transformed stacking context, which
  // would otherwise trap this overlay beneath the fixed nav dock.
  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Past Event Archive</span>
            <h2 id={titleId}>{event.title}</h2>
            <p>{eventMeta(event)}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close event media"
          >
            ×
          </button>
        </header>

        <div className={styles.stage}>
          {current ? (
            <>
              {current.media_type === 'video' ? (
                <video
                  key={current.id}
                  className={styles.media}
                  src={current.media_url}
                  poster={current.poster_url ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support embedded video.
                </video>
              ) : (
                // Event archive URLs can come from Supabase Storage or another approved media host.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={current.id}
                  className={styles.media}
                  src={current.media_url}
                  alt={current.caption || `${event.title} event photo`}
                />
              )}

              {canStep ? (
                <>
                  <button
                    type="button"
                    className={`${styles.arrow} ${styles.arrowLeft}`}
                    onClick={() => setIndex((index - 1 + media.length) % media.length)}
                    aria-label="Previous media"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className={`${styles.arrow} ${styles.arrowRight}`}
                    onClick={() => setIndex((index + 1) % media.length)}
                    aria-label="Next media"
                  >
                    →
                  </button>
                </>
              ) : null}
            </>
          ) : (
            <div className={styles.empty}>
              <span>Archive ready</span>
              <strong>Photos and video can be added later.</strong>
              <p>This event already has a media gallery slot. Nothing is published here until media is added in admin.</p>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div>
            {current?.caption ? <p className={styles.caption}>{current.caption}</p> : null}
            {media.length > 0 ? (
              <span className={styles.counter}>
                {String(index + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}
              </span>
            ) : null}
          </div>

          <div className={styles.footerActions}>
            <Link href={`/events/${event.slug}`} className={styles.detailLink}>
              Event details →
            </Link>
          </div>
        </footer>

        {media.length > 1 ? (
          <div className={styles.thumbs} aria-label="Event media">
            {media.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                className={itemIndex === index ? styles.thumbActive : styles.thumb}
                onClick={() => setIndex(itemIndex)}
                aria-label={`Show ${item.media_type} ${itemIndex + 1}`}
                aria-current={itemIndex === index ? 'true' : undefined}
              >
                {item.media_type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.media_url} alt="" />
                ) : item.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.poster_url} alt="" />
                ) : (
                  // No poster yet — let the browser show the clip's opening frame.
                  <video src={`${item.media_url}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} />
                )}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>,
    document.body
  )
}
