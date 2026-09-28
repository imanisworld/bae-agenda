'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './PortfolioMediaLightbox.module.css'

export type PortfolioArchiveEntry = {
  id: string
  event_name: string
  venue: string | null
  city: string
  year: number
  tags: string[]
  featured: boolean
  photo_url: string | null
}

export type PortfolioArchiveMedia = {
  id: string
  portfolio_entry_id: string
  media_type: 'image' | 'video'
  media_url: string
  poster_url: string | null
  caption: string | null
  sort_order: number
}

type LightboxItem = PortfolioArchiveMedia & { synthetic?: boolean }

function buildItems(entry: PortfolioArchiveEntry, media: PortfolioArchiveMedia[]): LightboxItem[] {
  const items = [...media].sort((a, b) => a.sort_order - b.sort_order)
  if (entry.photo_url && !items.some((item) => item.media_url === entry.photo_url)) {
    items.unshift({
      id: `cover-${entry.id}`,
      portfolio_entry_id: entry.id,
      media_type: 'image',
      media_url: entry.photo_url,
      poster_url: null,
      caption: null,
      sort_order: -1,
      synthetic: true,
    })
  }
  return items
}

export default function PortfolioMediaLightbox({
  entry,
  media,
  onClose,
}: {
  entry: PortfolioArchiveEntry
  media: PortfolioArchiveMedia[]
  onClose: () => void
}) {
  const items = useMemo(() => buildItems(entry, media), [entry, media])
  const [index, setIndex] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const current = items[index] ?? null

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (items.length > 1 && event.key === 'ArrowRight') {
        event.preventDefault()
        setIndex((value) => (value + 1) % items.length)
      } else if (items.length > 1 && event.key === 'ArrowLeft') {
        event.preventDefault()
        setIndex((value) => (value - 1 + items.length) % items.length)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [items.length, onClose])

  const location = [entry.venue, entry.city].filter(Boolean).join(' · ')

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-media-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Full Archive</span>
            <h2 id="portfolio-media-title">{entry.event_name}</h2>
            <p>{entry.year}{location ? ` · ${location}` : ''}</p>
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close media gallery">×</button>
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
                // URLs can come from Supabase Storage or another approved public host.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={current.id}
                  className={styles.media}
                  src={current.media_url}
                  alt={current.caption || `${entry.event_name} archive photo`}
                />
              )}

              {items.length > 1 ? (
                <>
                  <button
                    type="button"
                    className={`${styles.arrow} ${styles.arrowLeft}`}
                    onClick={() => setIndex((index - 1 + items.length) % items.length)}
                    aria-label="Previous media"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className={`${styles.arrow} ${styles.arrowRight}`}
                    onClick={() => setIndex((index + 1) % items.length)}
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
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div>
            {current?.caption ? <p className={styles.caption}>{current.caption}</p> : null}
            {items.length > 0 ? (
              <span className={styles.counter}>{String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
            ) : null}
          </div>
        </footer>

        {items.length > 1 ? (
          <div className={styles.thumbs} aria-label="Archive media">
            {items.map((item, itemIndex) => (
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
                  <span>VIDEO</span>
                )}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
