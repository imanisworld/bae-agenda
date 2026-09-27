'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './page.module.css'

type Direction = 'editorial' | 'archive' | 'dimensional' | 'afterdark'

const directions: Array<{ id: Direction; number: string; label: string; note: string }> = [
  { id: 'editorial', number: '01', label: 'Editorial Cutout', note: 'Type and photography physically interact.' },
  { id: 'archive', number: '02', label: 'Nightlife Archive', note: 'The work feels collected, not carded.' },
  { id: 'dimensional', number: '03', label: 'Dimensional Identity', note: 'One memorable moving object carries the motion.' },
  { id: 'afterdark', number: '04', label: 'After Dark', note: 'A quieter luxury direction with photography doing the work.' },
]

const collage = [
  { src: '/photos/PlexMix19-DJBAE.JPEG', alt: 'DJ B.A.E. performing at Club Plex', className: styles.collageOne },
  { src: '/photos/outdoor-night-set-pook.png', alt: 'DJ B.A.E. performing outdoors at night', className: styles.collageTwo },
  { src: '/photos/IMG_1120.JPG.jpeg', alt: 'DJ B.A.E. event photograph', className: styles.collageThree },
]

export default function StyleLabPage() {
  const [active, setActive] = useState<Direction>('editorial')
  const current = directions.find((direction) => direction.id === active) ?? directions[0]

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>THE BAE AGENDA · STYLE LAB 002</p>
        <h1>Same brand.<br />Different worlds.</h1>
        <p className={styles.lede}>
          Flip through four art directions using the same B.A.E. identity and real photography. We are choosing a visual language, not redesigning production yet.
        </p>
      </header>

      <section className={styles.pickerShell}>
        <div className={styles.picker} role="tablist" aria-label="B.A.E. art direction experiments">
          {directions.map((direction) => {
            const selected = active === direction.id
            return (
              <button
                key={direction.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={selected ? styles.pickerButtonActive : styles.pickerButton}
                onClick={() => setActive(direction.id)}
              >
                <span>{direction.number}</span>
                <strong>{direction.label}</strong>
              </button>
            )
          })}
        </div>

        <div className={styles.activeMeta}>
          <span>{current.number}</span>
          <div>
            <strong>{current.label}</strong>
            <p>{current.note}</p>
          </div>
        </div>

        <div className={styles.stageWrap} role="tabpanel">
          {active === 'editorial' && <EditorialStage />}
          {active === 'archive' && <ArchiveStage />}
          {active === 'dimensional' && <DimensionalStage />}
          {active === 'afterdark' && <AfterDarkStage />}
        </div>
      </section>

      <section className={styles.direction}>
        <p className={styles.kicker}>WHAT WE ARE ACTUALLY CHOOSING</p>
        <div className={styles.directionGrid}>
          <article><span>Photography</span><h3>How much do images break the grid?</h3><p>Cutouts, masks, overlap, full bleed, or quieter cinematic crops.</p></article>
          <article><span>Typography</span><h3>Does type behave like layout or identity?</h3><p>Behind imagery, over imagery, or restrained enough to let photographs dominate.</p></article>
          <article><span>Motion</span><h3>What deserves to move?</h3><p>A few deliberate moments should feel expensive, not busy.</p></article>
          <article><span>Archive</span><h3>How should the work feel collected?</h3><p>Poster wall, contact sheet, release catalog, editorial spread, or nightlife journal.</p></article>
        </div>
      </section>
    </main>
  )
}

function EditorialStage() {
  return (
    <div className={styles.editorialStage}>
      <div className={styles.editorialWord} aria-hidden="true">BAE</div>
      <div className={styles.editorialPhoto}>
        <Image
          src="/photos/images/outside.jpg"
          alt="DJ B.A.E. performing"
          fill
          sizes="(max-width: 800px) 90vw, 46vw"
          priority
        />
      </div>
      <div className={styles.editorialCopy}>
        <p>SELECTOR · GENRE BENDER</p>
        <h2>Sound<br />Architect</h2>
        <span>Indianapolis · Open format</span>
      </div>
      <div className={styles.editorialStamp}>LIVE<br />ENERGY</div>
    </div>
  )
}

function ArchiveStage() {
  return (
    <div className={styles.collageStage}>
      <div className={styles.collageHeadline}>
        <span>FROM THE ARCHIVE</span>
        <h2>Rooms.<br />Crowds.<br />Moments.</h2>
      </div>

      {collage.map((item) => (
        <figure key={item.src} className={item.className}>
          <Image src={item.src} alt={item.alt} fill sizes="40vw" />
        </figure>
      ))}

      <div className={styles.ticket}>
        <span>DJ B.A.E.</span>
        <strong>70 EVENTS</strong>
        <small>2018 — 2026</small>
      </div>
      <p className={styles.sideNote}>not a gallery. an archive.</p>
    </div>
  )
}

function DimensionalStage() {
  return (
    <div className={styles.dimensionStage}>
      <div className={styles.glow} />
      <div className={styles.logoObject}>
        <Image src="/photos/images/logo.JPG" alt="DJ B.A.E. logo" fill sizes="34vw" />
      </div>
      <div className={styles.phoneObject}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/images/phone%203d%20.gif" alt="Animated 3D phone" />
      </div>
      <div className={styles.dimensionCopy}>
        <p>IDENTITY IN MOTION</p>
        <h2>Objects can move.<br />The site doesn&apos;t have to.</h2>
        <span>
          One or two dimensional brand moments can carry the personality while the rest stays clean and grown.
        </span>
      </div>
    </div>
  )
}

function AfterDarkStage() {
  return (
    <div className={styles.afterDarkStage}>
      <div className={styles.afterDarkPhoto}>
        <Image
          src="/photos/outdoor-night-set-pook.png"
          alt="DJ B.A.E. performing outdoors at night"
          fill
          sizes="(max-width: 800px) 100vw, 70vw"
        />
      </div>
      <div className={styles.afterDarkShade} />
      <div className={styles.afterDarkTopline}>
        <span>DJ B.A.E.</span>
        <span>INDIANAPOLIS / OPEN FORMAT</span>
      </div>
      <div className={styles.afterDarkCopy}>
        <p>AFTER DARK</p>
        <h2>Less interface.<br />More atmosphere.</h2>
        <span>
          Big photography, quiet typography, almost no decoration. The grown version of nightlife.
        </span>
      </div>
      <div className={styles.afterDarkFooter}>
        <span>SELECTOR</span>
        <span>GENRE BENDER</span>
        <span>SOUND ARCHITECT</span>
      </div>
    </div>
  )
}
