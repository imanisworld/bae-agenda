'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import styles from './system-study.module.css'

const pieces = [
  {
    id: 'plex',
    src: '/photos/PlexMix19-DJBAE.JPEG',
    alt: 'DJ B.A.E. performing at Club Plex',
    title: 'Club Plex',
    index: '001',
    line: 'Mix 19 · Open format',
  },
  {
    id: 'night',
    src: '/photos/outdoor-night-set-pook.png',
    alt: 'DJ B.A.E. performing outdoors at night',
    title: 'Night set',
    index: '002',
    line: 'Open air · After dark',
  },
  {
    id: 'room',
    src: '/photos/IMG_1120.JPG.jpeg',
    alt: 'DJ B.A.E. event photograph',
    title: 'Room 1120',
    index: '003',
    line: 'Collected print',
  },
  {
    id: 'outside',
    src: '/photos/images/outside.jpg',
    alt: 'DJ B.A.E. performing',
    title: 'Outside',
    index: '004',
    line: 'Live energy',
  },
] as const

type Piece = (typeof pieces)[number]
type PieceId = Piece['id']
type Phase = 'wall' | 'forward' | 'open' | 'plated'
type Transit = 'out' | 'back' | null

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

function useMotionLoop() {
  const frame = useRef(0)
  const running = useRef(false)
  const last = useRef(0)
  const stepRef = useRef<(dt: number) => boolean>(() => false)

  const kick = useCallback(() => {
    if (running.current) return
    running.current = true
    last.current = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.032, Math.max(0, (now - last.current) / 1000))
      last.current = now
      let again = false
      try {
        again = stepRef.current(dt)
      } finally {
        if (again) frame.current = requestAnimationFrame(tick)
        else running.current = false
      }
    }

    frame.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => () => {
    cancelAnimationFrame(frame.current)
    running.current = false
  }, [])

  return { stepRef, kick }
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

function stepSpring(value: number, velocity: number, target: number, dt: number, omega: number, zeta: number) {
  const displacement = value - target
  const acceleration = -2 * zeta * omega * velocity - omega * omega * displacement
  const nextVelocity = clamp(velocity + acceleration * dt, -4000, 4000)
  return { value: value + nextVelocity * dt, velocity: nextVelocity }
}

function valueFromAngle(angle: number) {
  return ((clamp(angle, -140, 140) + 140) / 280) * 100
}

function angleFromValue(value: number) {
  return -140 + clamp(value, 0, 100) * 2.8
}

function roomWord(value: number) {
  if (value < 22) return 'Closed'
  if (value < 48) return 'Low'
  if (value < 74) return 'Open'
  return 'Bright'
}

function pointIn(element: HTMLElement | null, x: number, y: number) {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function releasePointer(event: PointerEvent<HTMLElement>) {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
}

function sleeveLabel(title: string, phase: Phase) {
  switch (phase) {
    case 'wall':
      return `${title}. Pull the sleeve forward.`
    case 'forward':
      return `${title}, pulled forward. Open the sleeve.`
    case 'open':
      return `${title} is open. Set the record on the platter.`
    case 'plated':
      return `${title}. The record is on the platter. Activate to return it.`
    default: {
      const exhaustive: never = phase
      throw new Error(`Unknown sleeve phase: ${exhaustive}`)
    }
  }
}

function ticketCopy(phase: Phase, transit: Transit, room: Piece, active: Piece | null) {
  const piece = active ?? room
  if (transit === 'out') {
    return { kicker: piece.index, title: piece.title, line: 'Crossing to the platter.' }
  }
  if (transit === 'back') {
    return { kicker: piece.index, title: piece.title, line: 'Back into the sleeve.' }
  }
  switch (phase) {
    case 'wall':
      return { kicker: '2018 — 2026', title: room.title, line: 'Pull a sleeve.' }
    case 'forward':
      return { kicker: piece.index, title: piece.title, line: 'Open the sleeve.' }
    case 'open':
      return { kicker: piece.index, title: piece.title, line: 'Set the record down.' }
    case 'plated':
      return { kicker: piece.index, title: piece.title, line: piece.line }
    default: {
      const exhaustive: never = phase
      throw new Error(`Unknown phase: ${exhaustive}`)
    }
  }
}

function findPiece(id: PieceId | null) {
  return pieces.find((item) => item.id === id) ?? null
}

export function SystemStudy() {
  const reduced = usePrefersReducedMotion()
  const roomRef = useRef<HTMLDivElement>(null)
  const wellRef = useRef<HTMLDivElement>(null)
  const platterRef = useRef<HTMLButtonElement>(null)
  const travelerRef = useRef<HTMLDivElement>(null)
  const travelLabelRef = useRef<HTMLSpanElement>(null)
  const sleeveRefs = useRef<Array<HTMLButtonElement | null>>([])
  const discRefs = useRef<Array<HTMLSpanElement | null>>([])
  const timers = useRef<number[]>([])
  const generation = useRef(0)
  const gesture = useRef({ moved: 0, y: 0, suppress: false })
  const transitRef = useRef<Transit>(null)
  const phaseRef = useRef<Phase>('wall')
  const activeRef = useRef<PieceId | null>(null)

  const [spread, setSpread] = useState(false)
  const [roomId, setRoomId] = useState<PieceId>('night')
  const [activeId, setActiveId] = useState<PieceId | null>(null)
  const [phase, setPhase] = useState<Phase>('wall')
  const [transit, setTransit] = useState<Transit>(null)
  const [playing, setPlaying] = useState(false)

  const room = findPiece(roomId) ?? pieces[1]
  const active = findPiece(activeId)
  const copy = ticketCopy(phase, transit, room, active)
  const loaded = phase === 'plated' && transit === null

  useEffect(() => {
    phaseRef.current = phase
    activeRef.current = activeId
    transitRef.current = transit
  }, [phase, activeId, transit])

  useEffect(() => () => {
    generation.current += 1
    for (const id of timers.current) window.clearTimeout(id)
  }, [])

  useEffect(() => {
    roomRef.current?.style.setProperty('--live', loaded && playing ? '1' : '0')
  }, [loaded, playing])

  function clearMotion() {
    generation.current += 1
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
    const traveler = travelerRef.current
    if (traveler) {
      traveler.dataset.show = 'false'
      traveler.style.transition = 'none'
    }
    wellRef.current?.setAttribute('data-ready', 'false')
    return generation.current
  }

  function later(gen: number, fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      if (generation.current !== gen) return
      fn()
    }, ms)
    timers.current.push(id)
  }

  function fly(fromEl: HTMLElement, toEl: HTMLElement, src: string, gen: number, done: () => void) {
    const traveler = travelerRef.current
    const label = travelLabelRef.current
    if (!traveler || !label || reduced) {
      done()
      return
    }
    const from = fromEl.getBoundingClientRect()
    const to = toEl.getBoundingClientRect()
    if (from.width < 4 || to.width < 4) {
      done()
      return
    }
    label.style.backgroundImage = `url("${src}")`
    traveler.style.left = `${from.left}px`
    traveler.style.top = `${from.top}px`
    traveler.style.width = `${from.width}px`
    traveler.style.height = `${from.height}px`
    traveler.style.transform = 'translate3d(0, 0, 0) scale(1)'
    traveler.style.transition = 'none'
    traveler.dataset.show = 'true'
    void traveler.offsetWidth
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2)
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2)
    const scale = to.width / from.width
    traveler.style.transition = 'transform 700ms cubic-bezier(.16, 1.02, .28, 1)'
    traveler.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`
    later(gen, () => {
      traveler.dataset.show = 'false'
      traveler.style.transition = 'none'
      done()
    }, 720)
  }

  function choose(id: PieceId, index?: number) {
    if (transitRef.current) return
    clearMotion()
    setTransit(null)
    setPlaying(false)
    setActiveId(id)
    setRoomId(id)
    setPhase('forward')
    if (index !== undefined) sleeveRefs.current[index]?.focus()
  }

  function plate(piece: Piece) {
    if (transitRef.current) return
    const index = pieces.findIndex((item) => item.id === piece.id)
    const from = discRefs.current[index]
    const to = platterRef.current
    setPlaying(false)
    if (!from || !to || reduced) {
      clearMotion()
      setTransit(null)
      setPhase('plated')
      return
    }
    const gen = clearMotion()
    setTransit('out')
    fly(from, to, piece.src, gen, () => {
      setTransit(null)
      setPhase('plated')
    })
  }

  function returnRecord() {
    if (phase !== 'plated' || !active || transitRef.current) return
    const index = pieces.findIndex((item) => item.id === active.id)
    const from = platterRef.current
    const to = discRefs.current[index]
    setPlaying(false)
    if (!from || !to || reduced) {
      clearMotion()
      setTransit(null)
      setPhase('wall')
      setActiveId(null)
      return
    }
    const gen = clearMotion()
    setTransit('back')
    fly(from, to, active.src, gen, () => {
      setTransit(null)
      setPhase('open')
      later(gen, () => {
        setPhase('forward')
        later(gen, () => {
          setPhase('wall')
          setActiveId(null)
        }, 460)
      }, 380)
    })
  }

  function advance(id: PieceId) {
    if (transitRef.current) return
    const piece = findPiece(id)
    if (!piece) return
    if (activeId !== id || phase === 'wall') {
      choose(id)
      return
    }
    switch (phase) {
      case 'forward':
        setPhase('open')
        break
      case 'open':
        plate(piece)
        break
      case 'plated':
        returnRecord()
        break
      default: {
        const exhaustive: never = phase
        throw new Error(`Unknown phase: ${exhaustive}`)
      }
    }
  }

  function onSleeveKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const nextIndex = event.key === 'ArrowRight'
      ? (index + 1) % pieces.length
      : event.key === 'ArrowLeft'
        ? (index - 1 + pieces.length) % pieces.length
        : event.key === 'Home'
          ? 0
          : pieces.length - 1
    const next = pieces[nextIndex]
    if (!next) return
    choose(next.id, nextIndex)
  }

  function onPlatterClick() {
    if (transitRef.current) return
    if (phaseRef.current === 'plated') {
      setPlaying((value) => !value)
      return
    }
    if (phaseRef.current === 'open' && activeRef.current) {
      const piece = findPiece(activeRef.current)
      if (piece) plate(piece)
    }
  }

  const platterLabel = loaded && active
    ? (playing ? `Pause ${active.title}` : `Play ${active.title}. Drag to nudge the record.`)
    : phase === 'open' && active
      ? `Empty platter. Set ${active.title} down.`
      : 'Empty platter.'

  return (
    <section className={styles.study} id="system-study" aria-labelledby="system-study-title">
      <p className={styles.kicker}>System study</p>
      <h2 className={styles.title} id="system-study-title">One room, still B.A.E.</h2>
      <p className={styles.copy}>
        Nightlife stays on the wall. A sleeve can leave it, open, and set a record on the platter. The portrait keeps its own gravity.
      </p>

      <div className={styles.room} ref={roomRef} data-phase={phase}>
        <div className={styles.atmosphere} aria-hidden="true">
          {pieces.map((piece) => (
            <div key={piece.id} className={styles.plate} data-on={roomId === piece.id ? 'true' : 'false'}>
              <Image src={piece.src} alt="" fill sizes="100vw" draggable={false} />
            </div>
          ))}
        </div>
        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.table} aria-hidden="true" />

        <BrandMark reduced={reduced} live={loaded && playing} />

        <div className={styles.pile}>
          <button
            type="button"
            className={styles.spread}
            aria-pressed={spread}
            onClick={() => setSpread((value) => !value)}
          >
            {spread ? 'Gather' : 'Spread'}
          </button>
          <div className={styles.stack} data-spread={spread ? 'true' : 'false'} role="group" aria-label="Sleeves from the archive">
            {pieces.map((piece, index) => {
              const selected = piece.id === activeId
              const itemPhase: Phase = selected ? phase : 'wall'
              const discOut = selected && (transit !== null || phase === 'plated')
              const label = selected && transit === 'out'
                ? `${piece.title}. The record is crossing to the platter.`
                : selected && transit === 'back'
                  ? `${piece.title}. The record is returning to the sleeve.`
                  : sleeveLabel(piece.title, itemPhase)
              return (
                <button
                  key={piece.id}
                  ref={(node) => { sleeveRefs.current[index] = node }}
                  type="button"
                  className={styles.sleeve}
                  data-phase={itemPhase}
                  data-disc={discOut ? 'out' : 'in'}
                  style={{ '--i': index } as CSSProperties}
                  aria-pressed={itemPhase !== 'wall'}
                  aria-label={label}
                  onPointerDown={(event) => {
                    gesture.current = { moved: 0, y: event.clientY, suppress: false }
                    event.currentTarget.setPointerCapture(event.pointerId)
                  }}
                  onPointerMove={(event) => {
                    const dy = event.clientY - gesture.current.y
                    gesture.current.moved = Math.max(gesture.current.moved, Math.abs(dy))
                    if (dy < -32 && activeRef.current !== piece.id && !transitRef.current) {
                      gesture.current.suppress = true
                      choose(piece.id)
                    }
                    const ready = phaseRef.current === 'open'
                      && activeRef.current === piece.id
                      && pointIn(wellRef.current, event.clientX, event.clientY)
                    wellRef.current?.setAttribute('data-ready', ready ? 'true' : 'false')
                  }}
                  onPointerUp={(event) => {
                    const dropped = phaseRef.current === 'open'
                      && activeRef.current === piece.id
                      && pointIn(wellRef.current, event.clientX, event.clientY)
                    wellRef.current?.setAttribute('data-ready', 'false')
                    if (dropped) {
                      gesture.current.suppress = true
                      plate(piece)
                    } else if (gesture.current.moved > 18) {
                      gesture.current.suppress = true
                    }
                    releasePointer(event)
                  }}
                  onPointerCancel={(event) => {
                    gesture.current.suppress = true
                    wellRef.current?.setAttribute('data-ready', 'false')
                    releasePointer(event)
                  }}
                  onClick={() => {
                    if (gesture.current.suppress) {
                      gesture.current.suppress = false
                      return
                    }
                    advance(piece.id)
                  }}
                  onKeyDown={(event) => onSleeveKey(event, index)}
                >
                  <span
                    className={styles.sleeveDisc}
                    ref={(node) => { discRefs.current[index] = node }}
                    aria-hidden="true"
                  >
                    <span className={styles.sleeveLabel}>
                      <Image src={piece.src} alt="" fill sizes="80px" draggable={false} />
                    </span>
                  </span>
                  <span className={styles.sleeveCover}>
                    <Image src={piece.src} alt="" fill sizes="220px" draggable={false} />
                    <span className={styles.sticker}>{piece.index}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.deck}>
          <RoomDial surfaceRef={roomRef} reduced={reduced} />
          <div className={styles.well} ref={wellRef}>
            <div className={loaded && playing ? styles.tonearm : styles.tonearmParked} aria-hidden="true">
              <span className={styles.tonearmPivot} />
              <span className={styles.tonearmWand} />
              <span className={styles.tonearmHead} />
            </div>
            <Platter
              buttonRef={platterRef}
              loaded={loaded}
              playing={playing && loaded}
              reduced={reduced}
              labelSrc={active?.src ?? room.src}
              label={platterLabel}
              onActivate={onPlatterClick}
            />
          </div>
          <button type="button" className={styles.lift} disabled={!loaded} onClick={returnRecord}>
            Return
          </button>
        </div>

        <aside className={styles.ticket} aria-live="polite">
          <span>DJ B.A.E.</span>
          <small>{copy.kicker}</small>
          <strong>{copy.title}</strong>
          <em>{copy.line}</em>
        </aside>

        <div className={styles.traveler} ref={travelerRef} aria-hidden="true">
          <span className={styles.travelLabel} ref={travelLabelRef} />
        </div>
      </div>
    </section>
  )
}

function BrandMark({ reduced, live }: { reduced: boolean; live: boolean }) {
  const { stepRef, kick } = useMotionLoop()
  const markRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const hovering = useRef(false)
  const motion = useRef({ rx: 6, ry: -14, vx: 0, vy: 0, targetRx: 6, targetRy: -14 })

  const paint = useCallback(() => {
    const m = motion.current
    if (tiltRef.current) {
      tiltRef.current.style.transform = `rotateX(${m.rx}deg) rotateY(${m.ry}deg)`
    }
    markRef.current?.style.setProperty('--lean', m.ry.toFixed(2))
  }, [])

  useEffect(() => {
    stepRef.current = (dt) => {
      const m = motion.current
      if (reduced) {
        m.rx = m.targetRx
        m.ry = m.targetRy
        m.vx = 0
        m.vy = 0
        paint()
        return false
      }
      const nextX = stepSpring(m.rx, m.vx, m.targetRx, dt, 8, 0.78)
      const nextY = stepSpring(m.ry, m.vy, m.targetRy, dt, 8, 0.78)
      m.rx = nextX.value
      m.vx = nextX.velocity
      m.ry = nextY.value
      m.vy = nextY.velocity
      paint()
      const moving = Math.abs(m.targetRx - m.rx) > 0.08
        || Math.abs(m.targetRy - m.ry) > 0.08
        || Math.abs(m.vx) > 0.08
        || Math.abs(m.vy) > 0.08
      if (!moving) {
        m.rx = m.targetRx
        m.ry = m.targetRy
        m.vx = 0
        m.vy = 0
        paint()
      }
      return moving
    }
    paint()
    kick()
  }, [kick, paint, reduced, stepRef])

  useEffect(() => {
    if (hovering.current) return
    motion.current.targetRx = live ? 9 : 6
    motion.current.targetRy = live ? -4 : -14
    kick()
  }, [kick, live])

  function look(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const py = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    motion.current.targetRx = clamp(6 + -py * 10, -6, 16)
    motion.current.targetRy = clamp(-14 + px * 16, -28, 18)
    kick()
  }

  function rest() {
    hovering.current = false
    motion.current.targetRx = live ? 9 : 6
    motion.current.targetRy = live ? -4 : -14
    kick()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const m = motion.current
    const step = event.shiftKey ? 8 : 4
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        m.targetRy = clamp(m.targetRy + step, -28, 18)
        break
      case 'ArrowLeft':
        event.preventDefault()
        m.targetRy = clamp(m.targetRy - step, -28, 18)
        break
      case 'ArrowUp':
        event.preventDefault()
        m.targetRx = clamp(m.targetRx - step, -6, 16)
        break
      case 'ArrowDown':
        event.preventDefault()
        m.targetRx = clamp(m.targetRx + step, -6, 16)
        break
      case 'Home':
        event.preventDefault()
        m.targetRx = live ? 9 : 6
        m.targetRy = live ? -4 : -14
        break
      default:
        return
    }
    kick()
  }

  return (
    <div
      ref={markRef}
      className={styles.mark}
      data-live={live ? 'true' : 'false'}
      tabIndex={0}
      role="group"
      aria-label="DJ B.A.E. portrait. Move across it, or use arrow keys. Home rests it."
      onPointerEnter={() => { hovering.current = true }}
      onPointerMove={look}
      onPointerLeave={rest}
      onKeyDown={onKeyDown}
    >
      <div className={styles.markTilt} ref={tiltRef}>
        <span className={styles.markBack} aria-hidden="true" />
        <span className={styles.markFace}>
          <Image src="/photos/images/logo.JPG" alt="" fill sizes="240px" draggable={false} />
          <span className={styles.markLight} aria-hidden="true" />
        </span>
        <span className={styles.markEdge} aria-hidden="true" />
      </div>
      <div className={styles.markShadow} aria-hidden="true" />
      <span className={styles.markName}>DJ B.A.E.</span>
    </div>
  )
}

function RoomDial({
  surfaceRef,
  reduced,
}: {
  surfaceRef: RefObject<HTMLDivElement | null>
  reduced: boolean
}) {
  const { stepRef, kick } = useMotionLoop()
  const dialRef = useRef<HTMLDivElement>(null)
  const shownRef = useRef(36)
  const [room, setRoom] = useState(36)
  const motion = useRef({
    angle: angleFromValue(36),
    velocity: 0,
    target: angleFromValue(36),
    dragging: false,
    lastTime: 0,
  })

  const publish = useCallback((angle: number) => {
    const shown = Math.round(valueFromAngle(angle))
    surfaceRef.current?.style.setProperty('--room', String(shown / 100))
    if (shown === shownRef.current) return
    shownRef.current = shown
    setRoom(shown)
  }, [surfaceRef])

  useEffect(() => {
    const paint = () => {
      const m = motion.current
      dialRef.current?.style.setProperty('--turn', `${m.angle}deg`)
      publish(m.angle)
    }

    stepRef.current = (dt) => {
      const m = motion.current
      if (reduced) {
        m.angle = m.target
        m.velocity = 0
        paint()
        return false
      }
      if (m.dragging) {
        paint()
        return true
      }
      if (Math.abs(m.velocity) > 24) {
        m.angle += m.velocity * dt
        m.velocity *= Math.exp(-3.1 * dt)
        if (m.angle <= -140 || m.angle >= 140) {
          m.angle = clamp(m.angle, -140, 140)
          m.velocity = 0
        }
        m.target = m.angle
        paint()
        return true
      }
      const next = stepSpring(m.angle, m.velocity, m.target, dt, 14, 0.86)
      m.angle = clamp(next.value, -140, 140)
      m.velocity = next.velocity
      if (Math.abs(m.angle - m.target) < 0.15 && Math.abs(m.velocity) < 8) {
        m.angle = m.target
        m.velocity = 0
        paint()
        return false
      }
      paint()
      return true
    }
    paint()
    kick()
  }, [kick, publish, reduced, stepRef])

  function angleFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - (rect.left + rect.width / 2)
    const y = event.clientY - (rect.top + rect.height / 2)
    let degrees = Math.atan2(y, x) * (180 / Math.PI) + 90
    if (degrees > 180) degrees -= 360
    return degrees
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const m = motion.current
    event.currentTarget.setPointerCapture(event.pointerId)
    m.dragging = true
    m.lastTime = performance.now()
    m.velocity = 0
    const next = clamp(angleFromPointer(event), -140, 140)
    m.angle = next
    m.target = next
    kick()
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const m = motion.current
    if (!m.dragging) return
    const now = performance.now()
    const next = clamp(angleFromPointer(event), -140, 140)
    const dt = Math.max(0.008, (now - m.lastTime) / 1000)
    m.velocity = clamp((next - m.angle) / dt, -720, 720)
    m.angle = next
    m.target = next
    m.lastTime = now
    kick()
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    motion.current.dragging = false
    releasePointer(event)
    kick()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Home') {
      event.preventDefault()
      motion.current.target = angleFromValue(36)
      motion.current.velocity = 0
      kick()
      return
    }
    const next = stepValue(event.key, Math.round(valueFromAngle(motion.current.target)), event.shiftKey)
    if (next === null) return
    event.preventDefault()
    motion.current.target = angleFromValue(next)
    motion.current.velocity = 0
    kick()
  }

  const word = roomWord(room)

  return (
    <div className={styles.dialBlock}>
      <span className={styles.dialName} id="system-room-label">Room</span>
      <div
        ref={dialRef}
        className={styles.dial}
        role="slider"
        tabIndex={0}
        aria-labelledby="system-room-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={room}
        aria-valuetext={`Room light ${room}, ${word}`}
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span className={styles.dialBezel} />
        <span className={styles.dialRotor}>
          <span className={styles.dialMark} />
        </span>
        <span className={styles.dialSheen} />
      </div>
      <span className={styles.dialWord}>{word}</span>
    </div>
  )
}

function Platter({
  buttonRef,
  loaded,
  playing,
  reduced,
  labelSrc,
  label,
  onActivate,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>
  loaded: boolean
  playing: boolean
  reduced: boolean
  labelSrc: string
  label: string
  onActivate: () => void
}) {
  const { stepRef, kick } = useMotionLoop()
  const discRef = useRef<HTMLSpanElement>(null)
  const motion = useRef({ angle: 0, velocity: 0 })
  const drag = useRef({ active: false, lastAngle: 0, moved: 0 })
  const playingRef = useRef(playing)
  const loadedRef = useRef(loaded)

  useEffect(() => {
    playingRef.current = playing
    loadedRef.current = loaded
  }, [playing, loaded])

  useEffect(() => {
    stepRef.current = (dt) => {
      const m = motion.current
      if (reduced || !loadedRef.current) {
        if (discRef.current) discRef.current.style.transform = 'none'
        m.velocity = 0
        return false
      }
      const target = playingRef.current && !drag.current.active ? 150 : 0
      const follow = drag.current.active ? 1 : playingRef.current ? 1.4 : 2.6
      m.velocity += (target - m.velocity) * Math.min(1, dt * follow)
      if (!playingRef.current && Math.abs(m.velocity) < 0.5) m.velocity = 0
      m.angle = (m.angle + m.velocity * dt) % 360
      if (discRef.current) discRef.current.style.transform = `rotate(${m.angle}deg)`
      return playingRef.current || drag.current.active || Math.abs(m.velocity) > 0.5
    }
    kick()
  }, [kick, reduced, stepRef])

  useEffect(() => { kick() }, [kick, playing, loaded])

  function pointerAngle(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - (rect.left + rect.width / 2)
    const y = event.clientY - (rect.top + rect.height / 2)
    return Math.atan2(y, x)
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.platter}
      aria-pressed={loaded ? playing : undefined}
      aria-label={label}
      onPointerDown={(event) => {
        if (!loadedRef.current || reduced) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { active: true, lastAngle: pointerAngle(event), moved: 0 }
        kick()
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
        kick()
      }}
      onPointerUp={(event) => {
        drag.current.active = false
        releasePointer(event)
        kick()
      }}
      onPointerCancel={() => { drag.current.active = false }}
      onClick={() => {
        if (drag.current.moved > 0.12) {
          drag.current.moved = 0
          return
        }
        onActivate()
      }}
    >
      <span className={styles.vinyl} ref={discRef} data-on={loaded ? 'true' : 'false'}>
        <span className={`${styles.groove} ${styles.grooveOne}`} />
        <span className={`${styles.groove} ${styles.grooveTwo}`} />
        <span className={styles.vinylLabel}>
          <Image src={labelSrc} alt="" fill sizes="90px" draggable={false} />
        </span>
      </span>
      <span className={styles.sheen} data-on={loaded ? 'true' : 'false'} aria-hidden="true" />
      <span className={styles.spindle} aria-hidden="true" />
    </button>
  )
}
