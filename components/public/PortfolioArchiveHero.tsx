'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import styles from './PortfolioArchiveHero.module.css'

export type ArchivePrint = {
  id: string
  event_name: string
  year: number
  photo_url: string
}

export default function PortfolioArchiveHero({
  prints,
  onExplore,
  instagramUrl,
}: {
  prints: ArchivePrint[]
  onExplore?: () => void
  instagramUrl?: string
}) {
  const [logoKicked, setLogoKicked] = useState(false)
  const logoTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (logoTimer.current) window.clearTimeout(logoTimer.current)
    }
  }, [])

  function kickLogo() {
    if (logoTimer.current) window.clearTimeout(logoTimer.current)
    setLogoKicked(false)
    window.requestAnimationFrame(() => {
      setLogoKicked(true)
      logoTimer.current = window.setTimeout(() => setLogoKicked(false), 900)
    })
  }

  function movePrint(event: PointerEvent<HTMLElement>) {
    const node = event.currentTarget
    if (event.pointerType === 'mouse') {
      const rect = node.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width - .5
      const py = (event.clientY - rect.top) / rect.height - .5
      node.style.setProperty('--print-ry', `${px * 5}deg`)
      node.style.setProperty('--print-rx', `${py * -4}deg`)
    }
  }

  function pressPrint(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty('--print-scale', '.98')
    event.currentTarget.style.setProperty('--print-lift', '3px')
  }

  function settlePrint(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty('--print-rx', '0deg')
    event.currentTarget.style.setProperty('--print-ry', '0deg')
    event.currentTarget.style.setProperty('--print-scale', '1')
    event.currentTarget.style.setProperty('--print-lift', '0px')
  }

  return (
    <section className={styles.hero} aria-labelledby="portfolio-title">
      <Image
        src="/photos/outdoor-night-set-pook.png"
        alt=""
        fill
        priority
        sizes="(max-width: 760px) 100vw, 60vw"
        quality={80}
        aria-hidden="true"
        className={styles.background}
      />
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.copy}>
        <span>Portfolio</span>
        <h1 id="portfolio-title">Past<br />work.</h1>
        <p>A look back at the rooms, crowds, and events along the way.</p>
        <div className={styles.actions}>
          {onExplore ? (
            <button id="portfolio-explore-archive" type="button" className={`btn-ghost ${styles.archive}`} onClick={onExplore}>See the full archive</button>
          ) : (
            <Link href="#archive" className={`btn-ghost ${styles.archive}`}>See the full archive</Link>
          )}
          {instagramUrl ? (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={styles.instagram}>
              More photos on Instagram
            </a>
          ) : null}
        </div>
      </div>

      {prints.length === 0 ? (
        // Fills the open side of the hero until portfolio photos are added in admin.
        <button
          type="button"
          className={`${styles.logoSpin}${logoKicked ? ` ${styles.logoKicked}` : ''}`}
          onPointerDown={kickLogo}
          aria-label="Bounce the DJ B.A.E. logo"
        >
          <Image src="/brand/dj-bae-logo.png" alt="" width={900} height={659} sizes="(max-width: 760px) 78vw, 42vw" className={styles.logoBounce} />
          <span className={styles.logoShadow} aria-hidden="true" />
        </button>
      ) : null}

      <div className={styles.printField} aria-label="Selected past work">
        {prints.slice(0, 3).map((entry, index) => (
          <article
            key={entry.id}
            className={styles.print}
            data-index={index + 1}
            onPointerMove={movePrint}
            onPointerDown={pressPrint}
            onPointerUp={settlePrint}
            onPointerCancel={settlePrint}
            onPointerLeave={settlePrint}
          >
            <div className={styles.printImage}>
              <Image
                src={entry.photo_url}
                alt={entry.event_name}
                fill
                sizes="(max-width: 760px) 44vw, 300px"
                quality={95}
              />
            </div>
            <div className={styles.printMeta}>
              <small>{String(index + 1).padStart(3, '0')} · {entry.year}</small>
              <strong>{entry.event_name}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.footerLine}>
        <span>THE BAE AGENDA</span>
        <span>PAST WORK · ARCHIVE</span>
      </div>
    </section>
  )
}
