'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import styles from './playground.module.css'

const archive = [
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
] as const

type Print = (typeof archive)[number]
type PrintId = Print['id']
type SleevePhase = 'stack' | 'forward' | 'open' | 'plated'

const experiments = [
  { id: 'elastic', number: '01', label: 'Elastic print', note: 'Angry Sliders, Jelly Slider. Drag the print or the pitch cap. It resists, overshoots once, and settles.' },
  { id: 'dial', number: '02', label: 'Machined dial', note: 'Dark Mode Knob, Rolling Dial. Turn the room light. The highlight crosses the face, then the knob coasts and stops.' },
  { id: 'stack', number: '03', label: 'Sleeve stack', note: 'MD Vinyl, Ramp Stack, Album Carousel. Pull a sleeve, open it, and set the record on the platter.' },
  { id: 'scan', number: '04', label: 'Light the print', note: 'Boarding Pass Scanner. Drag the light across the night-set print until the note appears.' },
  { id: 'cartridge', number: '05', label: 'Cartridge', note: 'Retro Cartridge Cards. Push a mix into the slot until it locks.' },
  { id: 'object', number: '06', label: 'Standing sleeve', note: 'Plot Device. Tilt the sleeve. It keeps its depth, shifts its shadow, and settles back to rest.' },
  { id: 'booth', number: '07', label: 'Listening booth', note: 'In-world room. Take a record from the crate and set it on the platter.' },
  { id: 'personality', number: '08', label: 'Sleeve attention', note: 'Mascot motion, applied to a sleeve. Approach it, drag it, or select it. The label lags and the light follows.' },
] as const

type ExperimentId = (typeof experiments)[number]['id']

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

function pointIn(element: HTMLElement | null, x: number, y: number) {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function roomWord(value: number) {
  if (value < 18) return 'closed'
  if (value < 42) return 'low'
  if (value < 70) return 'open'
  return 'bright'
}

function valueFromAngle(angle: number) {
  return ((clamp(angle, -140, 140) + 140) / 280) * 100
}

function angleFromValue(value: number) {
  return -140 + clamp(value, 0, 100) * 2.8
}

function sleeveLabel(title: string, phase: SleevePhase) {
  switch (phase) {
    case 'stack':
      return `${title} sleeve. Pull it from the stack.`
    case 'forward':
      return `${title} sleeve, pulled forward. Open it.`
    case 'open':
      return `${title} sleeve is open. Set the record on the platter.`
    case 'plated':
      return `${title} jacket. The record is on the platter.`
    default: {
      const exhaustive: never = phase
      throw new Error(`Unknown sleeve phase: ${exhaustive}`)
    }
  }
}

function stackStatus(phase: SleevePhase, title: string | null, spread: boolean) {
  switch (phase) {
    case 'stack':
      return spread ? 'The stack is spread.' : 'Three sleeves in the stack.'
    case 'forward':
      return `${title ?? 'The sleeve'} is pulled forward.`
    case 'open':
      return `${title ?? 'The sleeve'} is open.`
    case 'plated':
      return `${title ?? 'The record'} is on the platter.`
    default: {
      const exhaustive: never = phase
      throw new Error(`Unknown sleeve phase: ${exhaustive}`)
    }
  }
}

function releasePointer(event: PointerEvent<HTMLElement>) {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
}

export function InteractionPlayground() {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState<ExperimentId>('elastic')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const current = experiments.find((item) => item.id === active) ?? experiments[0]

  function moveTab(nextIndex: number) {
    const next = experiments[nextIndex]
    if (!next) return
    setActive(next.id)
    tabRefs.current[nextIndex]?.focus()
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        moveTab((index + 1) % experiments.length)
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveTab((index - 1 + experiments.length) % experiments.length)
        break
      case 'Home':
        event.preventDefault()
        moveTab(0)
        break
      case 'End':
        event.preventDefault()
        moveTab(experiments.length - 1)
        break
      default:
        break
    }
  }

  return (
    <section className={styles.playground} id="interaction-playground" aria-labelledby="interaction-playground-title">
      <p className={styles.kicker}>Interaction playground</p>
      <h2 className={styles.title} id="interaction-playground-title">Which gestures feel like the room?</h2>
      <p className={styles.copy}>
        Eight prototypes, separate from the six directions. This pass tests interaction. It does not choose the site.
      </p>

      <div className={styles.playPicker} role="tablist" aria-label="Interaction experiments">
        {experiments.map((item, index) => {
          const selected = active === item.id
          return (
            <button
              key={item.id}
              ref={(node) => { tabRefs.current[index] = node }}
              id={`play-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="playground-stage"
              tabIndex={selected ? 0 : -1}
              className={selected ? styles.playTabActive : styles.playTab}
              onClick={() => setActive(item.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span>{item.number}</span>
              <strong>{item.label}</strong>
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

      <div className={styles.bench} role="tabpanel" id="playground-stage" aria-labelledby={`play-tab-${active}`}>
        <ExperimentStage id={active} reduced={reduced} />
      </div>
    </section>
  )
}

function ExperimentStage({ id, reduced }: { id: ExperimentId; reduced: boolean }) {
  switch (id) {
    case 'elastic':
      return <ElasticPrint reduced={reduced} />
    case 'dial':
      return <MachinedDial reduced={reduced} />
    case 'stack':
      return <SleeveStack />
    case 'scan':
      return <ScanPrint reduced={reduced} />
    case 'cartridge':
      return <CartridgeBay />
    case 'object':
      return <StandingRecord reduced={reduced} />
    case 'booth':
      return <ListeningBooth />
    case 'personality':
      return <SleeveAttention reduced={reduced} />
    default: {
      const exhaustive: never = id
      throw new Error(`Unknown experiment: ${exhaustive}`)
    }
  }
}

function ElasticPrint({ reduced }: { reduced: boolean }) {
  const { stepRef, kick } = useMotionLoop()
  const frameRef = useRef<HTMLDivElement>(null)
  const lagRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const capRef = useRef<HTMLSpanElement>(null)
  const readoutRef = useRef<HTMLElement>(null)
  const motion = useRef({
    x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
    pitch: 50, pv: 0, pt: 50, pitchShown: 50,
    drag: null as null | 'print' | 'pitch',
    grabX: 0,
    grabY: 0,
  })

  useEffect(() => {
    stepRef.current = (dt) => {
      const m = motion.current
      const frame = frameRef.current
      const lag = lagRef.current
      const track = trackRef.current
      const cap = capRef.current
      if (!frame || !lag || !track || !cap) return false

      if (reduced) {
        m.x = m.tx
        m.y = m.ty
        m.vx = 0
        m.vy = 0
        m.pitch = m.pt
        m.pv = 0
      } else {
        const printOmega = m.drag === 'print' ? 18 : 8.2
        const printZeta = m.drag === 'print' ? 1.15 : 0.56
        const nextX = stepSpring(m.x, m.vx, m.tx, dt, printOmega, printZeta)
        const nextY = stepSpring(m.y, m.vy, m.ty, dt, printOmega, printZeta)
        m.x = nextX.value
        m.vx = nextX.velocity
        m.y = nextY.value
        m.vy = nextY.velocity
        if (m.x < -100 || m.x > 100) {
          m.x = clamp(m.x, -100, 100)
          m.vx *= -0.2
        }
        if (m.y < -70 || m.y > 70) {
          m.y = clamp(m.y, -70, 70)
          m.vy *= -0.2
        }

        const pitchOmega = m.drag === 'pitch' ? 20 : 9
        const pitchZeta = m.drag === 'pitch' ? 1.2 : 0.58
        const nextPitch = stepSpring(m.pitch, m.pv, m.pt, dt, pitchOmega, pitchZeta)
        m.pitch = nextPitch.value
        m.pv = nextPitch.velocity
        if (m.pitch < -4 || m.pitch > 104) {
          m.pitch = clamp(m.pitch, -4, 104)
          m.pv *= -0.15
        }
      }

      const skew = reduced ? 0 : clamp(m.vx * 0.012, -2.4, 2.4)
      frame.style.transform = `translate3d(${m.x}px, ${m.y}px, 0) skewX(${skew}deg)`
      const lagX = reduced ? 0 : clamp(-m.vx * 0.03, -8, 8)
      const lagY = reduced ? 0 : clamp(-m.vy * 0.03, -6, 6)
      lag.style.transform = `translate3d(${lagX}px, ${lagY}px, 0)`
      track.style.setProperty('--pitch', String(clamp(m.pitch, -4, 104) / 100))

      const shown = Math.round(clamp(m.pitch, 0, 100))
      if (shown !== m.pitchShown) {
        m.pitchShown = shown
        const detent = Math.abs(shown - 50) <= 1
        track.setAttribute('aria-valuenow', String(shown))
        track.setAttribute('aria-valuetext', detent ? `Pitch ${shown}, center` : `Pitch ${shown}`)
        if (readoutRef.current) readoutRef.current.textContent = shown.toString().padStart(2, '0')
      }

      if (reduced || m.drag) return !reduced && m.drag !== null
      const printMoving = Math.abs(m.tx - m.x) > 0.2 || Math.abs(m.ty - m.y) > 0.2 || Math.abs(m.vx) > 0.2 || Math.abs(m.vy) > 0.2
      const pitchMoving = Math.abs(m.pt - m.pitch) > 0.2 || Math.abs(m.pv) > 0.2
      if (!printMoving && !pitchMoving) {
        m.x = m.tx
        m.y = m.ty
        m.vx = 0
        m.vy = 0
        m.pitch = m.pt
        m.pv = 0
        return false
      }
      return true
    }
    kick()
  }, [kick, reduced, stepRef])

  function grabPrint(event: PointerEvent<HTMLDivElement>) {
    const m = motion.current
    event.currentTarget.setPointerCapture(event.pointerId)
    m.drag = 'print'
    m.tx = m.x
    m.ty = m.y
    event.currentTarget.setAttribute('data-dragging', 'true')
    kick()
  }

  function movePrint(event: PointerEvent<HTMLDivElement>) {
    const m = motion.current
    if (m.drag !== 'print') return
    m.tx = clamp(event.clientX - m.grabX, -72, 72)
    m.ty = clamp(event.clientY - m.grabY, -40, 40)
    kick()
  }

  function startPrint(event: PointerEvent<HTMLDivElement>) {
    const m = motion.current
    m.grabX = event.clientX - m.x
    m.grabY = event.clientY - m.y
    grabPrint(event)
  }

  function endPrint(event: PointerEvent<HTMLDivElement>) {
    if (motion.current.drag === 'print') motion.current.drag = null
    event.currentTarget.removeAttribute('data-dragging')
    releasePointer(event)
    kick()
  }

  function onPrintKey(event: KeyboardEvent<HTMLDivElement>) {
    const m = motion.current
    const step = event.shiftKey ? 28 : 14
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        m.tx = clamp(m.tx + step, -72, 72)
        break
      case 'ArrowLeft':
        event.preventDefault()
        m.tx = clamp(m.tx - step, -72, 72)
        break
      case 'ArrowUp':
        event.preventDefault()
        m.ty = clamp(m.ty - step, -40, 40)
        break
      case 'ArrowDown':
        event.preventDefault()
        m.ty = clamp(m.ty + step, -40, 40)
        break
      case 'Home':
        event.preventDefault()
        m.tx = 0
        m.ty = 0
        break
      default:
        return
    }
    kick()
  }

  function pitchFromPointer(clientY: number) {
    const track = trackRef.current
    if (!track) return motion.current.pt
    const rect = track.getBoundingClientRect()
    const travel = Math.max(1, rect.height - 36)
    const y = clamp(clientY - rect.top - 18, 0, travel)
    return Math.round((1 - y / travel) * 100)
  }

  function startPitch(event: PointerEvent<HTMLDivElement>) {
    const m = motion.current
    event.currentTarget.setPointerCapture(event.pointerId)
    m.drag = 'pitch'
    m.pt = pitchFromPointer(event.clientY)
    event.currentTarget.setAttribute('data-dragging', 'true')
    kick()
  }

  function movePitch(event: PointerEvent<HTMLDivElement>) {
    if (motion.current.drag !== 'pitch') return
    motion.current.pt = pitchFromPointer(event.clientY)
    kick()
  }

  function endPitch(event: PointerEvent<HTMLDivElement>) {
    const m = motion.current
    if (m.drag === 'pitch') {
      m.drag = null
      if (Math.abs(m.pt - 50) <= 4) m.pt = 50
    }
    event.currentTarget.removeAttribute('data-dragging')
    releasePointer(event)
    kick()
  }

  function onPitchKey(event: KeyboardEvent<HTMLDivElement>) {
    const next = stepValue(event.key, Math.round(motion.current.pt), event.shiftKey)
    if (next === null) return
    event.preventDefault()
    motion.current.pt = next
    kick()
  }

  return (
    <div className={styles.elasticScene}>
      <div className={styles.elasticStage}>
        <div
          ref={frameRef}
          className={styles.elasticPrint}
          tabIndex={0}
          role="group"
          aria-label="Draggable Club Plex print. Arrow keys move it. It resists, then settles. Home returns it to center."
          onPointerDown={startPrint}
          onPointerMove={movePrint}
          onPointerUp={endPrint}
          onPointerCancel={endPrint}
          onKeyDown={onPrintKey}
        >
          <div className={styles.elasticPhoto}>
            <div className={styles.elasticLag} ref={lagRef}>
              <Image src={archive[0].src} alt="" fill sizes="(max-width: 800px) 80vw, 420px" draggable={false} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.pitchColumn}>
        <span id="playground-pitch-label">Pitch</span>
        <div
          ref={trackRef}
          className={styles.pitchTrack}
          role="slider"
          tabIndex={0}
          aria-labelledby="playground-pitch-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          aria-valuetext="Pitch 50, center"
          aria-orientation="vertical"
          onPointerDown={startPitch}
          onPointerMove={movePitch}
          onPointerUp={endPitch}
          onPointerCancel={endPitch}
          onKeyDown={onPitchKey}
        >
          <span className={styles.pitchCap} ref={capRef} />
        </div>
        <small ref={readoutRef} className={styles.pitchReadout}>50</small>
      </div>
    </div>
  )
}

function MachinedDial({ reduced }: { reduced: boolean }) {
  const { stepRef, kick } = useMotionLoop()
  const dialRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLParagraphElement>(null)
  const motion = useRef({
    angle: angleFromValue(35),
    velocity: 0,
    target: angleFromValue(35),
    dragging: false,
    lastTime: 0,
    shown: 35,
  })

  useEffect(() => {
    const paint = () => {
      const m = motion.current
      const dial = dialRef.current
      const photo = photoRef.current
      if (!dial || !photo) return
      const shown = Math.round(valueFromAngle(m.angle))
      dial.style.setProperty('--turn', `${m.angle}deg`)
      photo.style.setProperty('--open', String(shown / 100))
      if (shown !== m.shown) {
        m.shown = shown
        dial.setAttribute('aria-valuenow', String(shown))
        dial.setAttribute('aria-valuetext', `Room light ${shown}, ${roomWord(shown)}`)
        if (readoutRef.current) readoutRef.current.textContent = `Room ${shown} · ${roomWord(shown)}`
      }
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
  }, [kick, reduced, stepRef])

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
    const next = stepValue(event.key, Math.round(valueFromAngle(motion.current.angle)), event.shiftKey)
    if (next === null) return
    event.preventDefault()
    motion.current.dragging = false
    motion.current.velocity = 0
    motion.current.target = angleFromValue(next)
    kick()
  }

  return (
    <div className={styles.dialScene}>
      <div className={styles.dialPhoto} ref={photoRef} style={{ '--open': 0.35 } as CSSProperties}>
        <Image src="/photos/images/outside.jpg" alt="" fill sizes="(max-width: 800px) 100vw, 700px" draggable={false} />
        <div className={styles.dialShade} />
      </div>
      <div className={styles.dialColumn}>
        <div className={styles.dialScale} aria-hidden="true"><span>Closed</span><span>Bright</span></div>
        <div
          ref={dialRef}
          className={styles.dial}
          role="slider"
          tabIndex={0}
          aria-label="Room light"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={35}
          aria-valuetext="Room light 35, low"
          aria-orientation="horizontal"
          style={{ '--turn': '-42deg' } as CSSProperties}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <span className={styles.dialBezel} aria-hidden="true" />
          <span className={styles.dialRotor} aria-hidden="true"><span className={styles.dialMark} /></span>
          <span className={styles.dialSheen} aria-hidden="true" />
        </div>
        <p className={styles.dialReadout} ref={readoutRef}>Room 35 · low</p>
      </div>
    </div>
  )
}

function SleeveStack() {
  const [spread, setSpread] = useState(false)
  const [activeId, setActiveId] = useState<PrintId | null>(null)
  const [phase, setPhase] = useState<SleevePhase>('stack')
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const pull = useRef({ moved: 0, y: 0 })
  const active = archive.find((item) => item.id === activeId) ?? null
  const shownPhase: SleevePhase = active ? phase : 'stack'

  function pullForward(id: PrintId, index: number) {
    setActiveId(id)
    setPhase('forward')
    buttonRefs.current[index]?.focus()
  }

  function advance(id: PrintId) {
    if (activeId !== id) {
      setActiveId(id)
      setPhase('forward')
      return
    }
    switch (phase) {
      case 'stack':
      case 'plated':
        setPhase('forward')
        break
      case 'forward':
        setPhase('open')
        break
      case 'open':
        setPhase('plated')
        break
      default: {
        const exhaustive: never = phase
        throw new Error(`Unknown sleeve phase: ${exhaustive}`)
      }
    }
  }

  function onSleeveKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const nextIndex = event.key === 'ArrowRight'
      ? (index + 1) % archive.length
      : event.key === 'ArrowLeft'
        ? (index - 1 + archive.length) % archive.length
        : event.key === 'Home'
          ? 0
          : archive.length - 1
    const next = archive[nextIndex]
    if (!next) return
    pullForward(next.id, nextIndex)
  }

  return (
    <div className={styles.stackScene}>
      <div className={styles.stackWell}>
        <div className={styles.benchBar}>
          <button type="button" className={styles.textButton} aria-pressed={spread} onClick={() => setSpread((value) => !value)}>
            {spread ? 'Close the stack' : 'Spread the stack'}
          </button>
          <p aria-live="polite">{stackStatus(shownPhase, active?.title ?? null, spread)}</p>
        </div>
        <div className={styles.stack} data-spread={spread ? 'true' : 'false'}>
          {archive.map((item, index) => {
            const itemPhase = item.id === activeId ? shownPhase : 'stack'
            return (
              <button
                key={item.id}
                ref={(node) => { buttonRefs.current[index] = node }}
                type="button"
                className={styles.sleeve}
                data-phase={itemPhase}
                style={{ '--i': index } as CSSProperties}
                aria-pressed={item.id === activeId && shownPhase !== 'stack'}
                aria-label={sleeveLabel(item.title, itemPhase)}
                onPointerDown={(event) => {
                  pull.current = { moved: 0, y: event.clientY }
                  event.currentTarget.setPointerCapture(event.pointerId)
                }}
                onPointerMove={(event) => {
                  const dy = event.clientY - pull.current.y
                  pull.current.moved = Math.max(pull.current.moved, Math.abs(dy))
                  if (dy < -28) pullForward(item.id, index)
                }}
                onPointerUp={releasePointer}
                onPointerCancel={releasePointer}
                onClick={() => {
                  if (pull.current.moved > 28) {
                    pull.current.moved = 0
                    return
                  }
                  advance(item.id)
                }}
                onKeyDown={(event) => onSleeveKey(event, index)}
              >
                <span className={styles.sleeveDisc} aria-hidden="true">
                  <span className={styles.sleeveLabel}>
                    <Image src={item.src} alt="" fill sizes="80px" draggable={false} />
                  </span>
                </span>
                <span className={styles.sleeveCover}>
                  <Image src={item.src} alt="" fill sizes="220px" draggable={false} />
                  <span className={styles.sleeveIndex}>{item.index}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className={styles.platterWell}>
        <button
          type="button"
          className={styles.platter}
          aria-label={shownPhase === 'plated' && active ? `Platter with ${active.title}. Return the record to the stack.` : 'Empty platter'}
          onClick={() => {
            if (shownPhase !== 'plated') return
            setActiveId(null)
            setPhase('stack')
          }}
        >
          {shownPhase === 'plated' && active ? (
            <span className={styles.platterDisc} key={active.id}>
              <span className={styles.platterLabel}>
                <Image src={active.src} alt="" fill sizes="90px" draggable={false} />
              </span>
            </span>
          ) : null}
        </button>
      </div>
    </div>
  )
}

const nightLight = {
  src: archive[1].src,
  kicker: 'Night set',
  title: 'Open air',
  detail: 'After dark',
  label: 'Move the light across the night-set print',
  idle: 'The note sits in the lower left. Move the light onto it.',
  lit: 'Night set · Open air · After dark',
  floor: 0,
}

export type LightCopy = typeof nightLight

export function ScanPrint({ reduced, copy = nightLight }: { reduced: boolean; copy?: LightCopy }) {
  const [scan, setScan] = useState<number | null>(null)
  const position = scan ?? (reduced ? 30 : 6)
  const reveal = Math.max(copy.floor, clamp(1 - Math.abs(position - 30) / 28, 0, 1))
  const lit = reveal > 0.62

  function scanFromClient(clientX: number, element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = stepValue(event.key, Math.round(position), event.shiftKey)
    if (next === null) return
    event.preventDefault()
    setScan(next)
  }

  return (
    <div className={styles.scanScene}>
      <div
        className={styles.scanPrint}
        role="slider"
        tabIndex={0}
        aria-label={copy.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={lit ? copy.lit : copy.idle}
        aria-orientation="horizontal"
        style={{ '--x': `${position}%`, '--reveal': String(reveal) } as CSSProperties}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setScan(scanFromClient(event.clientX, event.currentTarget))
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          setScan(scanFromClient(event.clientX, event.currentTarget))
        }}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onKeyDown={onKeyDown}
      >
        <div className={styles.scanDim}>
          <Image src={copy.src} alt="" fill sizes="(max-width: 800px) 100vw, 1180px" draggable={false} />
        </div>
        <div className={styles.scanBright}>
          <Image src={copy.src} alt="" fill sizes="(max-width: 800px) 100vw, 1180px" draggable={false} />
        </div>
        <div className={styles.scanBeam} aria-hidden="true" />
        <div className={styles.scanCopy}>
          <p>{copy.kicker}</p>
          <strong>{copy.title}</strong>
          <span>{copy.detail}</span>
        </div>
      </div>
      <p className={styles.scanStatus} aria-live="polite">
        {lit ? copy.lit : copy.idle}
      </p>
    </div>
  )
}

function CartridgeBody({ item, locked }: { item: Print; locked?: boolean }) {
  return (
    <span className={styles.cartridgeBody} data-locked={locked ? 'true' : 'false'}>
      <span className={styles.cartridgeCap} aria-hidden="true" />
      <span className={styles.cartridgeThumb}>
        <Image src={item.src} alt="" fill sizes="72px" draggable={false} />
      </span>
      <span className={styles.cartridgeCopy}>
        <small>{item.index}</small>
        <strong>{item.title}</strong>
      </span>
    </span>
  )
}

export function CartridgeBay() {
  const [loaded, setLoaded] = useState<PrintId | null>(null)
  const slotRef = useRef<HTMLButtonElement>(null)
  const bayRefs = useRef<Array<HTMLButtonElement | null>>([])
  const drag = useRef<{ id: PrintId; x: number; y: number; dx: number; dy: number } | null>(null)
  const suppress = useRef(false)
  const loadedPrint = archive.find((item) => item.id === loaded) ?? null

  function focusBay(start: number, direction: 1 | -1) {
    for (let step = 1; step <= archive.length; step += 1) {
      const index = (start + direction * step + archive.length) % archive.length
      const node = bayRefs.current[index]
      if (node && node.tabIndex !== -1) {
        node.focus()
        return
      }
    }
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>, id: PrintId) {
    const current = drag.current
    drag.current = null
    const element = event.currentTarget
    element.removeAttribute('data-dragging')
    releasePointer(event)
    if (!current || current.id !== id) return
    const moved = Math.hypot(current.dx, current.dy)
    if (moved > 8) suppress.current = true
    const hit = pointIn(slotRef.current, event.clientX, event.clientY)
    if (hit || moved < 8) {
      element.style.transform = ''
      setLoaded(id)
      return
    }
    requestAnimationFrame(() => { element.style.transform = '' })
  }

  return (
    <div className={styles.cartridgeScene}>
      <p className={styles.status} aria-live="polite">
        {loadedPrint ? `${loadedPrint.title} is locked in.` : 'The slot is empty.'}
      </p>
      <div className={styles.cartridgeBay}>
        {archive.map((item, index) => {
          const away = loaded === item.id
          return (
            <button
              key={item.id}
              ref={(node) => { bayRefs.current[index] = node }}
              type="button"
              className={styles.cartridge}
              data-away={away ? 'true' : 'false'}
              tabIndex={away ? -1 : 0}
              aria-hidden={away}
              aria-label={`Insert ${item.title}`}
              onPointerDown={(event) => {
                if (away) return
                suppress.current = false
                event.currentTarget.setPointerCapture(event.pointerId)
                drag.current = { id: item.id, x: event.clientX, y: event.clientY, dx: 0, dy: 0 }
                event.currentTarget.setAttribute('data-dragging', 'true')
              }}
              onPointerMove={(event) => {
                const current = drag.current
                if (!current || current.id !== item.id) return
                current.dx = event.clientX - current.x
                current.dy = event.clientY - current.y
                event.currentTarget.style.transform = `translate(${current.dx}px, ${current.dy}px)`
              }}
              onPointerUp={(event) => finishDrag(event, item.id)}
              onPointerCancel={(event) => {
                suppress.current = true
                drag.current = null
                event.currentTarget.removeAttribute('data-dragging')
                releasePointer(event)
                const element = event.currentTarget
                requestAnimationFrame(() => { element.style.transform = '' })
              }}
              onClick={() => {
                if (suppress.current) {
                  suppress.current = false
                  return
                }
                setLoaded(item.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault()
                  focusBay(index, 1)
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault()
                  focusBay(index, -1)
                }
              }}
            >
              <CartridgeBody item={item} />
            </button>
          )
        })}
      </div>
      <p className={styles.slotLabel}>Slot</p>
      <button
        ref={slotRef}
        type="button"
        className={styles.slot}
        disabled={!loadedPrint}
        aria-label={loadedPrint ? `${loadedPrint.title} is locked in the slot. Activate to eject it.` : 'Empty slot'}
        onClick={() => setLoaded(null)}
        onKeyDown={(event) => {
          if (!loadedPrint) return
          if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault()
            setLoaded(null)
          }
        }}
      >
        {loadedPrint ? <CartridgeBody item={loadedPrint} locked /> : <span className={styles.slotHint}>Empty</span>}
      </button>
    </div>
  )
}

const roomSleeve = {
  src: archive[2].src,
  caption: 'Room 1120',
  label: 'Standing Room 1120 sleeve. Move across it, or use arrow keys to tilt it. Home returns it to rest.',
}

export type StandingCopy = typeof roomSleeve

export function StandingRecord({
  reduced,
  copy = roomSleeve,
  presence = 'study',
}: {
  reduced: boolean
  copy?: StandingCopy
  presence?: 'study' | 'hero'
}) {
  const hero = presence === 'hero'
  const pose = hero
    ? { rx: 5, ry: -8, sway: 6, yaw: 9, minRx: -3, maxRx: 9, minRy: -14, maxRy: 12 }
    : { rx: 7, ry: -14, sway: 12, yaw: 20, minRx: -8, maxRx: 18, minRy: -32, maxRy: 26 }
  const { stepRef, kick } = useMotionLoop()
  const sceneRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const sheenRef = useRef<HTMLDivElement>(null)
  const motion = useRef({
    rx: pose.rx, ry: pose.ry, vx: 0, vy: 0, targetRx: pose.rx, targetRy: pose.ry,
  })

  useEffect(() => {
    const paint = () => {
      const m = motion.current
      if (tiltRef.current) {
        tiltRef.current.style.transform = `rotateX(${m.rx}deg) rotateY(${m.ry}deg)`
        if (hero) {
          const lift = 0.94 + Math.min(0.12, Math.abs(m.ry) / 110)
          tiltRef.current.style.setProperty('--turn-light', String(lift))
        }
      }
      if (shadowRef.current) {
        const shift = m.ry * (hero ? -2.2 : -1.5)
        const scale = hero ? 1 + Math.min(0.16, Math.abs(m.ry) / 100) : 1
        shadowRef.current.style.transform = `translateX(${shift}px) scaleX(${scale})`
        if (hero) shadowRef.current.style.opacity = String(0.42 + Math.min(0.28, Math.abs(m.ry) / 55))
      }
      if (sheenRef.current) {
        const glide = clamp((m.ry + 8) / 28, -1, 1)
        sheenRef.current.style.opacity = String(0.16 + Math.abs(glide) * 0.22)
        sheenRef.current.style.transform = `translateX(${glide * -10}%)`
      }
    }

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
      const omega = hero ? 6 : 8
      const zeta = hero ? 0.86 : 0.78
      const nextX = stepSpring(m.rx, m.vx, m.targetRx, dt, omega, zeta)
      const nextY = stepSpring(m.ry, m.vy, m.targetRy, dt, omega, zeta)
      m.rx = nextX.value
      m.vx = nextX.velocity
      m.ry = nextY.value
      m.vy = nextY.velocity
      paint()
      const moving = Math.abs(m.targetRx - m.rx) > 0.08 || Math.abs(m.targetRy - m.ry) > 0.08 || Math.abs(m.vx) > 0.08 || Math.abs(m.vy) > 0.08
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
  }, [hero, kick, reduced, stepRef])

  function tiltFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const py = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    return {
      rx: clamp(pose.rx + -py * pose.sway, pose.minRx, pose.maxRx),
      ry: clamp(pose.ry + px * pose.yaw, pose.minRy, pose.maxRy),
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const next = tiltFromPointer(event)
    motion.current.targetRx = next.rx
    motion.current.targetRy = next.ry
    kick()
  }

  function onPointerLeave() {
    motion.current.targetRx = pose.rx
    motion.current.targetRy = pose.ry
    kick()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const m = motion.current
    const step = event.shiftKey ? (hero ? 6 : 8) : (hero ? 3 : 4)
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        m.targetRy = clamp(m.targetRy + step, pose.minRy, pose.maxRy)
        break
      case 'ArrowLeft':
        event.preventDefault()
        m.targetRy = clamp(m.targetRy - step, pose.minRy, pose.maxRy)
        break
      case 'ArrowUp':
        event.preventDefault()
        m.targetRx = clamp(m.targetRx - step, pose.minRx, pose.maxRx)
        break
      case 'ArrowDown':
        event.preventDefault()
        m.targetRx = clamp(m.targetRx + step, pose.minRx, pose.maxRx)
        break
      case 'Home':
        event.preventDefault()
        m.targetRx = pose.rx
        m.targetRy = pose.ry
        break
      default:
        return
    }
    kick()
  }

  return (
    <div
      ref={sceneRef}
      className={hero ? `${styles.objectScene} ${styles.objectSceneHero}` : styles.objectScene}
      tabIndex={0}
      role="group"
      aria-label={copy.label}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
    >
      <div className={styles.objectPivot}>
        <div ref={tiltRef} className={styles.objectTilt}>
          <div className={styles.objectBack} />
          <div className={styles.objectFace}>
            <Image src={copy.src} alt="" fill sizes={hero ? '(max-width: 800px) 84vw, 480px' : '280px'} draggable={false} />
            {hero ? <div ref={sheenRef} className={styles.objectSheen} aria-hidden="true" /> : null}
          </div>
          <div className={styles.objectEdge} aria-hidden="true" />
        </div>
        <div ref={shadowRef} className={styles.objectShadow} aria-hidden="true" />
        {hero ? null : <p className={styles.objectCaption}>{copy.caption}</p>}
      </div>
    </div>
  )
}

export function ListeningBooth() {
  const [loaded, setLoaded] = useState<PrintId | null>(null)
  const crateRef = useRef<HTMLDivElement>(null)
  const platterRef = useRef<HTMLButtonElement>(null)
  const sleeveRefs = useRef<Array<HTMLButtonElement | null>>([])
  const drag = useRef<{ id: PrintId; x: number; y: number; dx: number; dy: number } | null>(null)
  const suppressSleeve = useRef(false)
  const suppressPlatter = useRef(false)
  const discRef = useRef<HTMLSpanElement>(null)
  const loadedPrint = archive.find((item) => item.id === loaded) ?? null

  function focusSleeve(start: number, direction: 1 | -1) {
    for (let step = 1; step <= archive.length; step += 1) {
      const index = (start + direction * step + archive.length) % archive.length
      const node = sleeveRefs.current[index]
      if (node && node.tabIndex !== -1) {
        node.focus()
        return
      }
    }
  }

  return (
    <div className={styles.booth}>
      <div className={styles.crate} ref={crateRef}>
        {archive.map((item, index) => {
          const away = loaded === item.id
          return (
            <button
              key={item.id}
              ref={(node) => { sleeveRefs.current[index] = node }}
              type="button"
              className={styles.crateSleeve}
              data-away={away ? 'true' : 'false'}
              tabIndex={away ? -1 : 0}
              aria-hidden={away}
              aria-label={`Set ${item.title} on the platter`}
              onPointerDown={(event) => {
                if (away) return
                suppressSleeve.current = false
                event.currentTarget.setPointerCapture(event.pointerId)
                drag.current = { id: item.id, x: event.clientX, y: event.clientY, dx: 0, dy: 0 }
                event.currentTarget.setAttribute('data-dragging', 'true')
              }}
              onPointerMove={(event) => {
                const current = drag.current
                if (!current || current.id !== item.id) return
                current.dx = event.clientX - current.x
                current.dy = event.clientY - current.y
                event.currentTarget.style.transform = `translate(${current.dx}px, ${current.dy}px)`
              }}
              onPointerUp={(event) => {
                const current = drag.current
                drag.current = null
                const element = event.currentTarget
                element.removeAttribute('data-dragging')
                releasePointer(event)
                if (!current || current.id !== item.id) return
                const moved = Math.hypot(current.dx, current.dy)
                if (moved > 8) suppressSleeve.current = true
                if (pointIn(platterRef.current, event.clientX, event.clientY) || moved < 8) {
                  element.style.transform = ''
                  setLoaded(item.id)
                  return
                }
                requestAnimationFrame(() => { element.style.transform = '' })
              }}
              onPointerCancel={(event) => {
                suppressSleeve.current = true
                drag.current = null
                event.currentTarget.removeAttribute('data-dragging')
                releasePointer(event)
                const element = event.currentTarget
                requestAnimationFrame(() => { element.style.transform = '' })
              }}
              onClick={() => {
                if (suppressSleeve.current) {
                  suppressSleeve.current = false
                  return
                }
                setLoaded(item.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault()
                  focusSleeve(index, 1)
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault()
                  focusSleeve(index, -1)
                }
              }}
            >
              <Image src={item.src} alt="" fill sizes="180px" draggable={false} />
            </button>
          )
        })}
      </div>
      <div className={styles.boothSide}>
        <button
          ref={platterRef}
          type="button"
          className={styles.boothPlatter}
          aria-label={loadedPrint ? `Platter holding ${loadedPrint.title}. Activate to return it to the crate.` : 'Empty platter. Choose a record from the crate.'}
          onPointerDown={(event) => {
            if (!loaded) return
            suppressPlatter.current = false
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = { id: loaded, x: event.clientX, y: event.clientY, dx: 0, dy: 0 }
            event.currentTarget.setAttribute('data-dragging', 'true')
          }}
          onPointerMove={(event) => {
            const current = drag.current
            if (!current || !event.currentTarget.hasPointerCapture(event.pointerId)) return
            current.dx = event.clientX - current.x
            current.dy = event.clientY - current.y
            if (discRef.current) discRef.current.style.transform = `translate(${current.dx}px, ${current.dy}px)`
          }}
          onPointerUp={(event) => {
            const current = drag.current
            drag.current = null
            event.currentTarget.removeAttribute('data-dragging')
            releasePointer(event)
            if (!current) return
            const moved = Math.hypot(current.dx, current.dy)
            if (moved > 8) suppressPlatter.current = true
            if (pointIn(crateRef.current, event.clientX, event.clientY) || moved < 8) {
              if (discRef.current) discRef.current.style.transform = ''
              setLoaded(null)
              return
            }
            const disc = discRef.current
            requestAnimationFrame(() => {
              if (disc) disc.style.transform = ''
            })
          }}
          onPointerCancel={(event) => {
            suppressPlatter.current = true
            drag.current = null
            event.currentTarget.removeAttribute('data-dragging')
            releasePointer(event)
            if (discRef.current) discRef.current.style.transform = ''
          }}
          onClick={() => {
            if (suppressPlatter.current) {
              suppressPlatter.current = false
              return
            }
            setLoaded(null)
          }}
        >
          {loadedPrint ? (
            <span className={styles.boothDisc} ref={discRef}>
              <span className={styles.boothLabel}>
                <Image src={loadedPrint.src} alt="" fill sizes="100px" draggable={false} />
              </span>
            </span>
          ) : null}
        </button>
        <div className={styles.cueRow}>
          <span className={styles.cue} data-on={loadedPrint ? 'true' : 'false'} aria-hidden="true" />
          <p className={styles.boothNote} aria-live="polite">
            {loadedPrint ? `In the booth · ${loadedPrint.title}` : 'Choose a record from the crate.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function SleeveAttention({ reduced }: { reduced: boolean }) {
  const { stepRef, kick } = useMotionLoop()
  const sceneRef = useRef<HTMLDivElement>(null)
  const sleeveRef = useRef<HTMLButtonElement>(null)
  const lagRef = useRef<HTMLDivElement>(null)
  const lightRef = useRef<HTMLDivElement>(null)
  const moved = useRef(0)
  const [selected, setSelected] = useState(false)
  const motion = useRef({
    x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
    rot: 0, vr: 0, targetRot: 0,
    lx: 0, ly: 0, lvx: 0, lvy: 0, ltx: 0, lty: 0,
    light: 0, lv: 0, targetLight: 0,
    dragging: false,
    grabX: 0,
    grabY: 0,
  })

  useEffect(() => {
    const scene = sceneRef.current
    if (scene) {
      const rect = scene.getBoundingClientRect()
      motion.current.lx = rect.width / 2
      motion.current.ly = rect.height / 2
      motion.current.ltx = motion.current.lx
      motion.current.lty = motion.current.ly
    }

    stepRef.current = (dt) => {
      const m = motion.current
      const sleeve = sleeveRef.current
      const lag = lagRef.current
      const light = lightRef.current
      if (!sleeve || !lag || !light) return false

      if (reduced) {
        m.x = m.tx
        m.y = m.ty
        m.vx = 0
        m.vy = 0
        m.rot = 0
        m.vr = 0
        m.targetRot = 0
        m.light = m.targetLight
        m.lv = 0
        m.lx = m.ltx
        m.ly = m.lty
        m.lvx = 0
        m.lvy = 0
      } else {
        const omega = m.dragging ? 16 : 9
        const zeta = m.dragging ? 1.05 : 0.72
        const nextX = stepSpring(m.x, m.vx, m.tx, dt, omega, zeta)
        const nextY = stepSpring(m.y, m.vy, m.ty, dt, omega, zeta)
        m.x = nextX.value
        m.vx = nextX.velocity
        m.y = nextY.value
        m.vy = nextY.velocity
        const nextRot = stepSpring(m.rot, m.vr, m.targetRot, dt, 10, 0.8)
        m.rot = nextRot.value
        m.vr = nextRot.velocity
        const nextLx = stepSpring(m.lx, m.lvx, m.ltx, dt, 7, 0.9)
        const nextLy = stepSpring(m.ly, m.lvy, m.lty, dt, 7, 0.9)
        const nextLight = stepSpring(m.light, m.lv, m.targetLight, dt, 8, 1)
        m.lx = nextLx.value
        m.lvx = nextLx.velocity
        m.ly = nextLy.value
        m.lvy = nextLy.velocity
        m.light = nextLight.value
        m.lv = nextLight.velocity
      }

      sleeve.style.transform = `translate3d(${m.x}px, ${m.y}px, 0) rotate(${m.rot}deg)`
      const slipX = reduced ? 0 : clamp(-m.vx * 0.045, -14, 14)
      const slipY = reduced ? 0 : clamp(-m.vy * 0.045, -10, 10)
      lag.style.transform = `translate3d(${slipX}px, ${slipY}px, 0)`
      light.style.transform = `translate3d(${m.lx}px, ${m.ly}px, 0)`
      light.style.opacity = String(clamp(m.light, 0, 1))

      if (reduced) return false
      const pos = Math.abs(m.tx - m.x) > 0.2 || Math.abs(m.ty - m.y) > 0.2 || Math.abs(m.vx) > 0.2 || Math.abs(m.vy) > 0.2
      const rot = Math.abs(m.targetRot - m.rot) > 0.05 || Math.abs(m.vr) > 0.05
      const lit = Math.abs(m.targetLight - m.light) > 0.02 || Math.abs(m.ltx - m.lx) > 0.4 || Math.abs(m.lty - m.ly) > 0.4
      return pos || rot || lit || m.dragging
    }
    kick()
  }, [kick, reduced, stepRef])

  function pointInScene(event: PointerEvent<HTMLElement>) {
    const scene = sceneRef.current
    if (!scene) return null
    const rect = scene.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      cx: rect.width / 2,
      cy: rect.height / 2,
    }
  }

  function follow(event: PointerEvent<HTMLElement>) {
    const point = pointInScene(event)
    if (!point) return
    const dx = point.x - point.cx
    const dy = point.y - point.cy
    const influence = clamp(1 - Math.hypot(dx, dy) / 520, 0, 1)
    motion.current.targetRot = clamp(dx / 80, -3.2, 3.2) * influence
    motion.current.ltx = point.x
    motion.current.lty = point.y
    motion.current.targetLight = 1
    kick()
  }

  return (
    <div
      ref={sceneRef}
      className={styles.attentionScene}
      onPointerMove={follow}
      onPointerLeave={() => {
        motion.current.targetRot = 0
        motion.current.targetLight = 0
        kick()
      }}
    >
      <div ref={lightRef} className={styles.followLight} aria-hidden="true" />
      <button
        ref={sleeveRef}
        type="button"
        className={styles.attentionSleeve}
        data-selected={selected ? 'true' : 'false'}
        data-dragging="false"
        aria-pressed={selected}
        aria-label={selected
          ? 'Club Plex sleeve, selected. Drag it. The label lags, then settles.'
          : 'Club Plex sleeve. Drag it, or activate to keep it selected.'}
        onPointerDown={(event) => {
          const m = motion.current
          moved.current = 0
          event.currentTarget.setPointerCapture(event.pointerId)
          m.dragging = true
          m.grabX = event.clientX - m.x
          m.grabY = event.clientY - m.y
          event.currentTarget.setAttribute('data-dragging', 'true')
          kick()
        }}
        onPointerMove={(event) => {
          const m = motion.current
          if (!m.dragging) return
          const nextX = clamp(event.clientX - m.grabX, -90, 90)
          const nextY = clamp(event.clientY - m.grabY, -50, 50)
          moved.current = Math.max(moved.current, Math.hypot(nextX - m.tx, nextY - m.ty))
          m.tx = nextX
          m.ty = nextY
          kick()
        }}
        onPointerUp={(event) => {
          motion.current.dragging = false
          event.currentTarget.setAttribute('data-dragging', 'false')
          releasePointer(event)
          kick()
        }}
        onPointerCancel={(event) => {
          motion.current.dragging = false
          event.currentTarget.setAttribute('data-dragging', 'false')
          releasePointer(event)
          kick()
        }}
        onClick={() => {
          if (moved.current > 6) {
            moved.current = 0
            return
          }
          setSelected((value) => !value)
        }}
        onKeyDown={(event) => {
          const m = motion.current
          const step = event.shiftKey ? 24 : 12
          switch (event.key) {
            case 'ArrowRight':
              event.preventDefault()
              m.tx = clamp(m.tx + step, -90, 90)
              break
            case 'ArrowLeft':
              event.preventDefault()
              m.tx = clamp(m.tx - step, -90, 90)
              break
            case 'ArrowUp':
              event.preventDefault()
              m.ty = clamp(m.ty - step, -50, 50)
              break
            case 'ArrowDown':
              event.preventDefault()
              m.ty = clamp(m.ty + step, -50, 50)
              break
            case 'Home':
              event.preventDefault()
              m.tx = 0
              m.ty = 0
              m.targetRot = 0
              break
            default:
              return
          }
          kick()
        }}
      >
        <span className={styles.attentionLag} ref={lagRef}>
          <Image src={archive[0].src} alt="" fill sizes="260px" draggable={false} />
        </span>
      </button>
    </div>
  )
}
