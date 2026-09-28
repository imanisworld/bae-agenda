'use client'

import Image from 'next/image'
import Link from 'next/link'
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
        <p>Rooms, crowds, and moments collected across the archive.</p>
        <div className={styles.actions}>
          {onExplore ? (
            <button id="portfolio-explore-archive" type="button" className="btn-ghost" onClick={onExplore}>Explore the archive</button>
          ) : (
            <Link href="#archive" className="btn-ghost">Explore the archive</Link>
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
        <div className={styles.logoSpin} aria-hidden="true">
          <Image src="/brand/dj-bae-logo.png" alt="" width={900} height={659} sizes="(max-width: 760px) 78vw, 42vw" className={styles.logoBounce} />
          <span className={styles.logoShadow} />
        </div>
      ) : null}

      <div className={styles.printField} aria-label="Selected past work">
        {prints.slice(0, 3).map((entry, index) => (
          <article key={entry.id} className={styles.print} data-index={index + 1}>
            <div className={styles.printImage}>
              <Image
                src={entry.photo_url}
                alt={entry.event_name}
                fill
                sizes="(max-width: 760px) 44vw, 300px"
                quality={90}
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
