'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { ApplicationMap, type ApprovedEvent, type ApprovedMix } from './application-map'
import { DimensionalStage, EditorialStage } from './direction-stages'
import { InteractionPlayground } from './playground'
import { SystemStudy } from './system-study'
import styles from './page.module.css'

type Direction = 'editorial' | 'archive' | 'dimensional' | 'afterdark' | 'deck' | 'blend'
type DeckMode = 'mixes' | 'events' | 'archive'
type ScanPhase = 'idle' | 'reading' | 'read'

const directions: Array<{ id: Direction; number: string; label: string; note: string }> = [
  { id: 'editorial', number: '01', label: 'Editorial Cutout', note: 'Drag the print. Type and photography occupy the same space.' },
  { id: 'archive', number: '02', label: 'Nightlife Archive', note: 'Select a print. The wall keeps the rest in place.' },
  { id: 'dimensional', number: '03', label: 'Dimensional Identity', note: 'Move across the portrait. It turns with the room.' },
  { id: 'afterdark', number: '04', label: 'After Dark', note: 'Raise the lights. The photograph does the rest.' },
  { id: 'deck', number: '05', label: 'B.A.E. Control Deck', note: 'Play the record, turn the knob, and load a sleeve.' },
  { id: 'blend', number: '06', label: 'Night Edit', note: 'After Dark, one type collision, a collected strip, and a record that can stop.' },
]

const collage = [
  { src: '/photos/PlexMix19-DJBAE.JPEG', alt: 'DJ B.A.E. performing at Club Plex', className: styles.collageOne },
  { src: '/photos/outdoor-night-set-pook.png', alt: 'DJ B.A.E. performing outdoors at night', className: styles.collageTwo },
  { src: '/photos/IMG_1120.JPG.jpeg', alt: 'DJ B.A.E. event photograph', className: styles.collageThree },
]

const sleeves = [
  { src: '/photos/PlexMix19-DJBAE.JPEG', alt: 'DJ B.A.E. performing at Club Plex', title: 'Club Plex', index: '001' },
  { src: '/photos/outdoor-night-set-pook.png', alt: 'DJ B.A.E. performing outdoors at night', title: 'Outdoor night', index: '002' },
  { src: '/photos/IMG_1120.JPG.jpeg', alt: 'DJ B.A.E. event photograph', title: 'Event photograph', index: '003' },
] as const

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function stepValue(key: string, value: number, shiftKey: boolean) {
  const delta = shiftKey ? 10 : 2
  switch (key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return clamp(value + delta, 0, 100)
    case 'ArrowDown':
    case 'ArrowLeft':
      return clamp(value - delta, 0, 100)
    case 'Home':
      return 0
    case 'End':
      return 100
    case 'PageUp':
      return clamp(value + 10, 0, 100)
    case 'PageDown':
      return clamp(value - 10, 0, 100)
    default:
      return null
  }
}

function modeContext(mode: DeckMode) {
  switch (mode) {
    case 'mixes':
      return { eyebrow: 'Now spinning', context: 'Open format' }
    case 'events':
      return { eyebrow: 'In the room', context: 'Live room' }
    case 'archive':
      return { eyebrow: 'From the archive', context: 'Collected, 2018–2026' }
    default: {
      const exhaustive: never = mode
      throw new Error(`Unknown deck mode: ${exhaustive}`)
    }
  }
}

export default function StyleLabClient({
  mixes,
  events,
}: {
  mixes: ApprovedMix[]
  events: ApprovedEvent[]
}) {
  const [active, setActive] = useState<Direction>('editorial')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const current = directions.find((direction) => direction.id === active) ?? directions[0]

  function moveTab(nextIndex: number) {
    const next = directions[nextIndex]
    if (!next) return
    setActive(next.id)
    tabRefs.current[nextIndex]?.focus()
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        moveTab((index + 1) % directions.length)
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveTab((index - 1 + directions.length) % directions.length)
        break
      case 'Home':
        event.preventDefault()
        moveTab(0)
        break
      case 'End':
        event.preventDefault()
        moveTab(directions.length - 1)
        break
      default:
        break
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>THE BAE AGENDA · STYLE LAB 003</p>
        <h1>Same brand.<br />Different worlds.</h1>
        <p className={styles.lede}>
          The directions, the system study, and the interaction playground are exploration. The application map is the approved plan for the site. It does not change production yet.
        </p>
      </header>

      <section className={styles.pickerShell}>
        <div className={styles.picker} role="tablist" aria-label="Exploratory art directions">
          {directions.map((direction, index) => {
            const selected = active === direction.id
            return (
              <button
                key={direction.id}
                ref={(node) => { tabRefs.current[index] = node }}
                id={`style-tab-${direction.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="style-lab-stage"
                tabIndex={selected ? 0 : -1}
                className={selected ? styles.pickerButtonActive : styles.pickerButton}
                onClick={() => setActive(direction.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
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

        <div
          className={styles.stageWrap}
          role="tabpanel"
          id="style-lab-stage"
          aria-labelledby={`style-tab-${active}`}
        >
          <Stage id={active} />
        </div>
      </section>

      <section className={styles.direction}>
        <p className={styles.kicker}>EXPLORATION · NOT THE APPROVED PLAN</p>
        <div className={styles.directionGrid}>
          <article><span>Photography</span><h3>How much do images break the grid?</h3><p>Cutouts, masks, overlap, full bleed, or quieter cinematic crops.</p></article>
          <article><span>Typography</span><h3>Does type behave like layout or identity?</h3><p>Behind imagery, over imagery, or restrained enough to let photographs dominate.</p></article>
          <article><span>Motion</span><h3>What deserves to move?</h3><p>A few deliberate moments should feel expensive, not busy.</p></article>
          <article><span>Archive</span><h3>How should the work feel collected?</h3><p>Poster wall, contact sheet, release catalog, editorial spread, or nightlife journal.</p></article>
        </div>
      </section>

      <SystemStudy />
      <ApplicationMap mixes={mixes} events={events} />
      <InteractionPlayground />
    </div>
  )
}

function Stage({ id }: { id: Direction }) {
  switch (id) {
    case 'editorial':
      return <EditorialStage priority />
    case 'archive':
      return <ArchiveStage />
    case 'dimensional':
      return <DimensionalStage />
    case 'afterdark':
      return <AfterDarkStage />
    case 'deck':
      return <ControlDeckStage />
    case 'blend':
      return <NightEditStage />
    default: {
      const exhaustive: never = id
      throw new Error(`Unknown style direction: ${exhaustive}`)
    }
  }
}

function ArchiveStage() {
  const [selected, setSelected] = useState(0)
  const printRefs = useRef<Array<HTMLButtonElement | null>>([])
  const current = collage[selected] ?? collage[0]

  function choose(index: number) {
    setSelected(index)
    printRefs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = event.key === 'ArrowRight'
      ? (index + 1) % collage.length
      : (index - 1 + collage.length) % collage.length
    choose(next)
  }

  return (
    <div className={styles.collageStage}>
      <div className={styles.collageHeadline}>
        <span>FROM THE ARCHIVE</span>
        <h2>Rooms.<br />Crowds.<br />Moments.</h2>
      </div>

      <div className={styles.printGroup} role="group" aria-label="Archive prints">
        {collage.map((item, index) => {
          const isSelected = selected === index
          return (
            <button
              key={item.src}
              ref={(node) => { printRefs.current[index] = node }}
              type="button"
              className={`${styles.print} ${item.className}${isSelected ? ` ${styles.printSelected}` : ''}`}
              aria-label={item.alt}
              aria-pressed={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              <Image src={item.src} alt="" fill sizes="40vw" />
              <span className={styles.printIndex}>0{index + 1}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.ticket} aria-live="polite">
        <span>DJ B.A.E.</span>
        <strong>70 EVENTS</strong>
        <small>2018 — 2026</small>
        <em>{current.alt}</em>
      </div>
    </div>
  )
}

function AfterDarkStage() {
  const [lightsUp, setLightsUp] = useState(false)

  return (
    <div className={styles.afterDarkStage} data-lights={lightsUp ? 'up' : 'low'}>
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
        <button
          type="button"
          className={styles.lightsButton}
          aria-pressed={lightsUp}
          onClick={() => setLightsUp((value) => !value)}
        >
          {lightsUp ? 'Dim the room' : 'Raise the lights'}
        </button>
      </div>
    </div>
  )
}

function ControlDeckStage() {
  const reduced = usePrefersReducedMotion()
  const [mode, setMode] = useState<DeckMode>('mixes')
  const [playing, setPlaying] = useState(true)
  const [energy, setEnergy] = useState(68)
  const [tone, setTone] = useState(42)
  const [sleeveIndex, setSleeveIndex] = useState(0)
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle')
  const [scanId, setScanId] = useState(0)
  const sleeveRefs = useRef<Array<HTMLButtonElement | null>>([])
  const railRef = useRef<HTMLDivElement>(null)
  const scanToken = useRef(0)
  const sleeve = sleeves[sleeveIndex] ?? sleeves[0]
  const context = modeContext(mode)

  useEffect(() => {
    const rail = railRef.current
    const card = sleeveRefs.current[sleeveIndex]
    if (!rail || !card) return
    const left = card.offsetLeft - rail.clientWidth / 2 + card.clientWidth / 2
    rail.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' })
  }, [sleeveIndex, reduced])

  function beginScan() {
    if (reduced) {
      setScanPhase('read')
      return
    }
    const token = scanToken.current + 1
    scanToken.current = token
    setScanId(token)
    setScanPhase('reading')
    window.setTimeout(() => {
      if (scanToken.current === token) setScanPhase('read')
    }, 980)
  }

  function chooseSleeve(index: number, shouldFocus = false) {
    setSleeveIndex(index)
    beginScan()
    if (shouldFocus) sleeveRefs.current[index]?.focus()
  }

  function chooseMode(next: DeckMode) {
    setMode(next)
    beginScan()
  }

  return (
    <div className={styles.deckStage}>
      <div className={styles.deckTopbar}>
        <div>
          <span className={playing ? styles.deckLed : styles.deckLedIdle} />
          <strong>B.A.E. CONTROL DECK</strong>
        </div>
        <span>{playing ? '33 RPM' : 'Paused'}</span>
      </div>

      <div className={styles.deckBody}>
        <section className={styles.platterSection} aria-label="Platter">
          <div className={styles.platterWell}>
            <div className={playing ? styles.tonearm : styles.tonearmParked} aria-hidden="true">
              <span className={styles.tonearmPivot} />
              <span className={styles.tonearmWand} />
              <span className={styles.tonearmHead} />
            </div>
            <Vinyl
              playing={playing && !reduced}
              coasting={playing}
              rate={0.82 + energy / 220}
              reduced={reduced}
              labelSrc={sleeve.src}
              onToggle={() => setPlaying((value) => !value)}
            />
          </div>
          <div className={styles.trackReadout} aria-live="polite">
            <p>{context.eyebrow}</p>
            <strong>{sleeve.title}</strong>
            <span>{sleeve.alt}</span>
          </div>
        </section>

        <section className={styles.controlSection} aria-label="Deck controls">
          <ToneKnob value={tone} onChange={setTone} />
          <PitchFader value={energy} onChange={setEnergy} />
          <div className={styles.deckButtons} role="group" aria-label="Listening source">
            {(['mixes', 'events', 'archive'] as const).map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={mode === item}
                className={mode === item ? styles.hardwareButtonActive : styles.hardwareButton}
                onClick={() => chooseMode(item)}
              >
                <span>{item === 'mixes' ? 'A' : item === 'events' ? 'B' : 'C'}</span>
                {item}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.shelf}>
        <div className={styles.moduleHeader}>
          <span>Sleeves</span>
          <div className={styles.railNav}>
            <button type="button" onClick={() => chooseSleeve((sleeveIndex - 1 + sleeves.length) % sleeves.length)}>
              Previous sleeve
            </button>
            <button type="button" onClick={() => chooseSleeve((sleeveIndex + 1) % sleeves.length)}>
              Next sleeve
            </button>
          </div>
        </div>
        <div className={styles.releaseRail} ref={railRef} role="radiogroup" aria-label="Release sleeves">
          {sleeves.map((item, index) => {
            const checked = sleeveIndex === index
            return (
              <button
                key={item.src}
                ref={(node) => { sleeveRefs.current[index] = node }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                className={styles.releaseCard}
                style={{ '--lean': `${(index - 1) * 1.5}deg` } as CSSProperties}
                onClick={() => chooseSleeve(index)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                  event.preventDefault()
                  const next = event.key === 'ArrowRight'
                    ? (index + 1) % sleeves.length
                    : (index - 1 + sleeves.length) % sleeves.length
                  chooseSleeve(next, true)
                }}
              >
                <Image src={item.src} alt="" fill sizes="220px" />
                <span className={styles.sleeveSpine} aria-hidden="true" />
                <span className={styles.sleeveCopy}>
                  <span>{item.index}</span>
                  <strong>{item.title}</strong>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className={styles.reader} aria-label="Sleeve reader">
        <div className={styles.slot}>
          <article
            key={scanId}
            className={scanPhase === 'reading' ? styles.cartridgeReading : styles.cartridge}
          >
            <p>THE BAE AGENDA</p>
            <strong>{sleeve.title}</strong>
            <span>{context.context}</span>
            <span className={styles.scanCode} aria-hidden="true" />
            <span className={styles.readerStatus}>
              {scanPhase === 'reading' ? 'Reading sleeve' : scanPhase === 'read' ? 'Sleeve loaded' : 'Ready to scan'}
            </span>
            {scanPhase === 'reading' ? (
              <span
                className={styles.scanLine}
                onAnimationEnd={() => setScanPhase('read')}
                aria-hidden="true"
              />
            ) : null}
          </article>
        </div>
        <button type="button" className={styles.scanButton} onClick={beginScan}>
          Scan sleeve
        </button>
      </section>

      <p className={styles.deckFooter}>
        <span>{sleeve.index} · {sleeve.title}</span>
        <span>Tone {tone.toString().padStart(2, '0')}</span>
        <span>Pitch {energy.toString().padStart(2, '0')}</span>
      </p>
    </div>
  )
}

function NightEditStage() {
  const reduced = usePrefersReducedMotion()
  const [playing, setPlaying] = useState(true)
  const [nightIndex, setNightIndex] = useState(1)
  const nightRefs = useRef<Array<HTMLButtonElement | null>>([])
  const night = sleeves[nightIndex] ?? sleeves[1]

  function chooseNight(index: number, shouldFocus = false) {
    setNightIndex(index)
    if (shouldFocus) nightRefs.current[index]?.focus()
  }

  return (
    <div className={styles.blendStage}>
      <div className={styles.blendPhoto}>
        <Image
          src={night.src}
          alt={night.alt}
          fill
          sizes="(max-width: 800px) 100vw, 70vw"
        />
      </div>
      <div className={styles.blendShade} />
      <div className={styles.blendTopline}>
        <span>DJ B.A.E.</span>
        <span>INDIANAPOLIS / OPEN FORMAT</span>
      </div>
      <div className={styles.blendBody}>
        <div className={styles.blendCopy}>
          <p>NIGHT EDIT</p>
          <h2>Sound<br />Architect</h2>
          <span aria-live="polite">{night.alt}</span>
        </div>
        <div className={styles.blendRecord}>
          <div className={styles.platterWell}>
            <div className={playing ? styles.tonearm : styles.tonearmParked} aria-hidden="true">
              <span className={styles.tonearmPivot} />
              <span className={styles.tonearmWand} />
              <span className={styles.tonearmHead} />
            </div>
            <Vinyl
              playing={playing && !reduced}
              coasting={playing}
              rate={1}
              reduced={reduced}
              labelSrc={night.src}
              onToggle={() => setPlaying((value) => !value)}
            />
          </div>
        </div>
        <div className={styles.blendStrip} role="radiogroup" aria-label="Nights from the archive">
          {sleeves.map((item, index) => {
            const checked = nightIndex === index
            return (
              <button
                key={item.src}
                ref={(node) => { nightRefs.current[index] = node }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={item.alt}
                tabIndex={checked ? 0 : -1}
                className={styles.blendThumb}
                onClick={() => chooseNight(index)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                  event.preventDefault()
                  const next = event.key === 'ArrowRight'
                    ? (index + 1) % sleeves.length
                    : (index - 1 + sleeves.length) % sleeves.length
                  chooseNight(next, true)
                }}
              >
                <Image src={item.src} alt="" fill sizes="160px" />
                <span>{item.index}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Vinyl({
  playing,
  coasting,
  rate,
  reduced,
  labelSrc,
  onToggle,
}: {
  playing: boolean
  coasting: boolean
  rate: number
  reduced: boolean
  labelSrc: string
  onToggle: () => void
}) {
  const discRef = useRef<HTMLSpanElement>(null)
  const motion = useRef({ angle: 0, velocity: 0 })
  const drag = useRef({ active: false, lastAngle: 0, moved: 0 })
  const rateRef = useRef(rate)
  const playingRef = useRef(playing)

  useEffect(() => {
    rateRef.current = rate
    playingRef.current = playing
  }, [rate, playing])

  useEffect(() => {
    if (reduced) {
      if (discRef.current) discRef.current.style.transform = 'none'
      return
    }

    let frame = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      const target = playingRef.current && !drag.current.active ? 168 * rateRef.current : 0
      const follow = drag.current.active ? 1 : playingRef.current ? 1.5 : 2.8
      motion.current.velocity += (target - motion.current.velocity) * Math.min(1, dt * follow)
      if (!playingRef.current && Math.abs(motion.current.velocity) < 0.6) motion.current.velocity = 0
      motion.current.angle = (motion.current.angle + motion.current.velocity * dt) % 360
      if (discRef.current) discRef.current.style.transform = `rotate(${motion.current.angle}deg)`
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [reduced])

  function pointerAngle(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - (rect.left + rect.width / 2)
    const y = event.clientY - (rect.top + rect.height / 2)
    return Math.atan2(y, x)
  }

  return (
    <button
      type="button"
      className={styles.platterButton}
      aria-pressed={coasting}
      aria-label={coasting ? 'Pause the record' : 'Play the record. Drag to nudge it.'}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { active: true, lastAngle: pointerAngle(event), moved: 0 }
      }}
      onPointerMove={(event) => {
        if (!drag.current.active || reduced) return
        const next = pointerAngle(event)
        let delta = next - drag.current.lastAngle
        if (delta > Math.PI) delta -= Math.PI * 2
        if (delta < -Math.PI) delta += Math.PI * 2
        drag.current.lastAngle = next
        drag.current.moved += Math.abs(delta)
        motion.current.angle += delta * (180 / Math.PI)
        motion.current.velocity = delta * (180 / Math.PI) * 10
      }}
      onPointerUp={(event) => {
        drag.current.active = false
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }}
      onPointerCancel={() => { drag.current.active = false }}
      onClick={() => {
        if (drag.current.moved > 0.12) {
          drag.current.moved = 0
          return
        }
        onToggle()
      }}
    >
      <span className={styles.vinyl} ref={discRef}>
        <span className={styles.vinylGrooveOne} />
        <span className={styles.vinylGrooveTwo} />
        <span className={styles.vinylLabel}>
          <Image src={labelSrc} alt="" fill sizes="120px" />
        </span>
      </span>
      <span className={styles.platterSheen} aria-hidden="true" />
      <span className={styles.spindle} aria-hidden="true" />
    </button>
  )
}

function ToneKnob({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  function valueFromPointer(event: PointerEvent<HTMLDivElement>) {
    const element = ref.current
    if (!element) return value
    const rect = element.getBoundingClientRect()
    const x = event.clientX - (rect.left + rect.width / 2)
    const y = event.clientY - (rect.top + rect.height / 2)
    let degrees = Math.atan2(y, x) * (180 / Math.PI) + 90
    if (degrees > 180) degrees -= 360
    const clamped = clamp(degrees, -140, 140)
    return Math.round(((clamped + 140) / 280) * 100)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = stepValue(event.key, value, event.shiftKey)
    if (next === null) return
    event.preventDefault()
    onChange(next)
  }

  return (
    <div className={styles.knobBlock}>
      <span id="bae-tone-label">Tone</span>
      <div className={styles.knobWell} aria-hidden="true" />
      <div
        ref={ref}
        className={styles.knob}
        data-dragging={dragging}
        role="slider"
        tabIndex={0}
        aria-labelledby="bae-tone-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`Tone ${value}`}
        aria-orientation="horizontal"
        style={{ '--knob-turn': `${-140 + value * 2.8}deg` } as CSSProperties}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
          onChange(valueFromPointer(event))
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          onChange(valueFromPointer(event))
        }}
        onPointerUp={(event) => {
          setDragging(false)
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onKeyDown={onKeyDown}
      >
        <span />
      </div>
      <small>{value.toString().padStart(2, '0')}</small>
    </div>
  )
}

function PitchFader({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  function valueFromPointer(clientY: number) {
    const track = trackRef.current
    if (!track) return value
    const rect = track.getBoundingClientRect()
    const ratio = 1 - (clientY - rect.top) / rect.height
    return clamp(Math.round(ratio * 100), 0, 100)
  }

  function finish(next: number) {
    const snapped = Math.abs(next - 50) <= 3 ? 50 : next
    onChange(snapped)
    setDragging(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = stepValue(event.key, value, event.shiftKey)
    if (next === null) return
    event.preventDefault()
    onChange(next)
  }

  return (
    <div className={styles.faderBlock}>
      <span id="bae-pitch-label">Pitch</span>
      <div className={styles.faderRow}>
        <div
          ref={trackRef}
          className={styles.faderTrack}
          data-dragging={dragging}
          role="slider"
          tabIndex={0}
          aria-labelledby="bae-pitch-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`Pitch ${value}. 50 is center.`}
          aria-orientation="vertical"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            setDragging(true)
            onChange(valueFromPointer(event.clientY))
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
            onChange(valueFromPointer(event.clientY))
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
            finish(valueFromPointer(event.clientY))
          }}
          onKeyDown={onKeyDown}
        >
          <span className={styles.faderCap} style={{ '--fader': value } as CSSProperties} />
        </div>
        <div className={styles.meter} aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} data-on={value >= (8 - index) * 12 ? 'true' : 'false'} />
          ))}
        </div>
      </div>
      <small>{value.toString().padStart(2, '0')}</small>
    </div>
  )
}
