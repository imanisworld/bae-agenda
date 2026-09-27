'use client'

import Image from 'next/image'
import { useState, type CSSProperties } from 'react'
import styles from './page.module.css'

type Direction = 'editorial' | 'archive' | 'dimensional' | 'afterdark' | 'deck'

const directions: Array<{ id: Direction; number: string; label: string; note: string }> = [
  { id: 'editorial', number: '01', label: 'Editorial Cutout', note: 'Type and photography physically interact.' },
  { id: 'archive', number: '02', label: 'Nightlife Archive', note: 'The work feels collected, not carded.' },
  { id: 'dimensional', number: '03', label: 'Dimensional Identity', note: 'One memorable moving object carries the motion.' },
  { id: 'afterdark', number: '04', label: 'After Dark', note: 'A quieter luxury direction with photography doing the work.' },
  { id: 'deck', number: '05', label: 'B.A.E. Control Deck', note: 'Music hardware becomes the interaction language.' },
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
        <p className={styles.kicker}>THE BAE AGENDA · STYLE LAB 003</p>
        <h1>Same brand.<br />Different worlds.</h1>
        <p className={styles.lede}>
          Flip through five art directions using the same B.A.E. identity and real photography. We are choosing a visual language, not redesigning production yet.
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
          {active === 'deck' && <ControlDeckStage />}
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


function ControlDeckStage() {
  const [mode, setMode] = useState<'mixes' | 'events' | 'archive'>('mixes')
  const [playing, setPlaying] = useState(true)
  const [energy, setEnergy] = useState(68)
  const [tone, setTone] = useState(42)

  const modeCopy = {
    mixes: {
      eyebrow: 'NOW SPINNING',
      title: 'BAE IN THE LAB',
      detail: 'Open format · live mix',
    },
    events: {
      eyebrow: 'NEXT SIGNAL',
      title: 'LIVE ROOMS',
      detail: 'Upcoming dates · real energy',
    },
    archive: {
      eyebrow: 'MEMORY BANK',
      title: 'THE ARCHIVE',
      detail: '70 events · 2018—2026',
    },
  }[mode]

  return (
    <div className={styles.deckStage}>
      <div className={styles.deckTopbar}>
        <div>
          <span className={styles.deckLed} />
          <strong>B.A.E. CONTROL DECK</strong>
        </div>
        <span>SYS 05 · ONLINE</span>
      </div>

      <div className={styles.deckGrid}>
        <section className={styles.deckPlatterModule} aria-label="Interactive vinyl player">
          <div className={styles.moduleHeader}>
            <span>PLATTER</span>
            <span>{playing ? '33⅓ RPM' : 'PAUSED'}</span>
          </div>

          <button
            type="button"
            className={styles.platterButton}
            aria-label={playing ? 'Pause record' : 'Play record'}
            onClick={() => setPlaying((value) => !value)}
          >
            <span className={playing ? styles.vinylSpinning : styles.vinyl}>
              <span className={styles.vinylGrooveOne} />
              <span className={styles.vinylGrooveTwo} />
              <span className={styles.vinylLabel}>
                <Image src="/photos/images/logo.JPG" alt="" fill sizes="120px" />
              </span>
              <span className={styles.vinylHole} />
            </span>
          </button>

          <div className={styles.trackReadout}>
            <p>{modeCopy.eyebrow}</p>
            <strong>{modeCopy.title}</strong>
            <span>{modeCopy.detail}</span>
          </div>
        </section>

        <section className={styles.deckControlsModule} aria-label="Control deck">
          <div className={styles.moduleHeader}>
            <span>CONTROL</span>
            <span>INPUT 01</span>
          </div>

          <div className={styles.knobBlock}>
            <label htmlFor="bae-tone">TONE</label>
            <div
              className={styles.knob}
              style={{ '--knob-turn': `${-135 + tone * 2.7}deg` } as CSSProperties}
            >
              <span />
            </div>
            <input
              id="bae-tone"
              type="range"
              min="0"
              max="100"
              value={tone}
              onChange={(event) => setTone(Number(event.target.value))}
              className={styles.hiddenRange}
            />
            <small>{tone.toString().padStart(2, '0')}</small>
          </div>

          <label className={styles.deckSlider}>
            <span>ENERGY</span>
            <input
              type="range"
              min="0"
              max="100"
              value={energy}
              onChange={(event) => setEnergy(Number(event.target.value))}
              style={{ '--range-value': `${energy}%` } as CSSProperties}
            />
            <strong>{energy}</strong>
          </label>

          <div className={styles.deckButtons}>
            {(['mixes', 'events', 'archive'] as const).map((item) => (
              <button
                type="button"
                key={item}
                className={mode === item ? styles.hardwareButtonActive : styles.hardwareButton}
                onClick={() => setMode(item)}
              >
                <span>{item === 'mixes' ? 'A' : item === 'events' ? 'B' : 'C'}</span>
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.deckCarouselModule}>
          <div className={styles.moduleHeader}>
            <span>RELEASE BANK</span>
            <span>03 ITEMS</span>
          </div>

          <div className={styles.releaseRail}>
            <article className={styles.releaseCard}>
              <Image src="/photos/PlexMix19-DJBAE.JPEG" alt="DJ B.A.E. live set" fill sizes="240px" />
              <div><span>001</span><strong>LIVE SET</strong></div>
            </article>
            <article className={styles.releaseCard}>
              <Image src="/photos/outdoor-night-set-pook.png" alt="DJ B.A.E. outdoor performance" fill sizes="240px" />
              <div><span>002</span><strong>AFTER DARK</strong></div>
            </article>
            <article className={styles.releaseCard}>
              <Image src="/photos/IMG_1120.JPG.jpeg" alt="DJ B.A.E. event" fill sizes="240px" />
              <div><span>003</span><strong>ARCHIVE</strong></div>
            </article>
          </div>
        </section>

        <section className={styles.deckScannerModule}>
          <div className={styles.moduleHeader}>
            <span>EVENT CARTRIDGE</span>
            <span>READY</span>
          </div>

          <div className={styles.cartridge}>
            <div className={styles.cartridgeNotch} />
            <p>THE BAE AGENDA</p>
            <strong>{mode === 'events' ? 'NEXT EVENT' : mode === 'archive' ? 'ARCHIVE 070' : 'MIX BANK'}</strong>
            <div className={styles.scanCode} aria-hidden="true" />
            <span>INSERT / SELECT / PLAY</span>
          </div>

          <div className={styles.scannerLine} aria-hidden="true" />
        </section>
      </div>

      <div className={styles.deckFooter}>
        <span>TACTILE UI</span>
        <span>VINYL · KNOBS · FADERS · CARTRIDGES</span>
        <span>NO MASCOT REQUIRED</span>
      </div>
    </div>
  )
}
