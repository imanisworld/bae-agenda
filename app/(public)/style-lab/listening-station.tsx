'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import type { ApprovedMix } from './application-map'
import styles from './listening-station.module.css'

type Phase = 'empty' | 'travel' | 'plated'

const labMarks = [
  { id: 'soon', label: 'Coming Soon' },
  { id: 'bench', label: 'In the Lab' },
  { id: 'wip', label: 'Work in Progress' },
] as const

function toEmbedSrc(embedUrl: string, autoplay: boolean) {
  const normalized = embedUrl.toLowerCase()
  const play = autoplay ? 'true' : 'false'
  if (normalized.includes('w.soundcloud.com/player') || normalized.includes('/embed/')) {
    try {
      const url = new URL(embedUrl)
      url.searchParams.set('auto_play', play)
      return url.toString()
    } catch {
      return embedUrl
    }
  }
  if (normalized.includes('soundcloud.com')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(embedUrl)}&color=%23c4a574&auto_play=${play}&hide_related=true&show_comments=false&visual=false`
  }
  const youtubeMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i)
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=${autoplay ? '1' : '0'}`
  }
  return embedUrl
}

function coverHostOk(url: string) {
  try {
    const host = new URL(url).hostname
    return host.endsWith('.supabase.co') || host.endsWith('.supabase.in') || host.endsWith('.sndcdn.com') || host === 'sndcdn.com'
  } catch {
    return false
  }
}

export function ListeningStation({ mixes, reduced }: { mixes: ApprovedMix[]; reduced: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('empty')
  const [playing, setPlaying] = useState(false)
  const [travel, setTravel] = useState<{ x: number; y: number; dx: number; dy: number; src: string | null; title: string } | null>(null)
  const [travelOn, setTravelOn] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const platterRef = useRef<HTMLButtonElement>(null)
  const sleeveRefs = useRef<Array<HTMLButtonElement | null>>([])
  const timer = useRef(0)
  const active = mixes.find((mix) => mix.id === activeId) ?? null

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function load(mix: ApprovedMix, index: number) {
    window.clearTimeout(timer.current)
    setPlaying(false)
    setActiveId(mix.id)
    const from = sleeveRefs.current[index]
    const platter = platterRef.current
    const stage = stageRef.current
    if (reduced || !from || !platter || !stage) {
      setPhase('plated')
      setTravel(null)
      return
    }
    const stageBox = stage.getBoundingClientRect()
    const fromBox = from.getBoundingClientRect()
    const toBox = platter.getBoundingClientRect()
    setTravel({
      x: fromBox.left - stageBox.left + fromBox.width / 2 - 36,
      y: fromBox.top - stageBox.top + fromBox.height / 2 - 36,
      dx: (toBox.left + toBox.width / 2) - (fromBox.left + fromBox.width / 2),
      dy: (toBox.top + toBox.height / 2) - (fromBox.top + fromBox.height / 2),
      src: mix.coverUrl,
      title: mix.title,
    })
    setTravelOn(false)
    setPhase('travel')
    requestAnimationFrame(() => setTravelOn(true))
    timer.current = window.setTimeout(() => {
      setPhase('plated')
      setTravel(null)
      setTravelOn(false)
    }, 680)
  }

  function onSleeveKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = event.key === 'ArrowRight'
      ? (index + 1) % mixes.length
      : (index - 1 + mixes.length) % mixes.length
    const mix = mixes[next]
    if (!mix) return
    load(mix, next)
    sleeveRefs.current[next]?.focus()
  }

  return (
    <div className={styles.station} ref={stageRef}>
      <p className={styles.kicker}>Lab</p>
      <div className={styles.well}>
        <span className={playing && phase === 'plated' ? styles.tonearm : styles.tonearmParked} aria-hidden="true">
          <span className={styles.pivot} />
          <span className={styles.wand} />
          <span className={styles.head} />
        </span>
        <Record
          buttonRef={platterRef}
          playing={playing && phase === 'plated'}
          reduced={reduced}
          cover={phase === 'plated' ? active?.coverUrl ?? null : null}
          title={active?.title ?? null}
          onToggle={() => {
            if (phase !== 'plated') return
            setPlaying((value) => !value)
          }}
        />
      </div>

      {travel ? (
        <span
          className={styles.traveler}
          data-on={travelOn ? 'true' : 'false'}
          style={{
            left: travel.x,
            top: travel.y,
            transform: travelOn ? `translate(${travel.dx}px, ${travel.dy}px)` : 'translate(0, 0)',
          }}
          aria-hidden="true"
        >
          {travel.src && coverHostOk(travel.src) ? <Image src={travel.src} alt="" fill sizes="72px" /> : null}
        </span>
      ) : null}

      <p className={styles.readout} aria-live="polite">
        {phase === 'travel' && active ? `${active.title} is moving to the platter.` : null}
        {phase === 'plated' && active ? `${active.title}${active.genre ? ` · ${active.genre}` : ''}${playing ? ' · Playing' : ' · Paused'}` : null}
        {mixes.length > 0 && phase === 'empty' ? 'Choose a sleeve.' : null}
      </p>

      {phase === 'plated' && active?.embedUrl && playing ? (
        <iframe
          className={styles.embed}
          title={active.title}
          src={toEmbedSrc(active.embedUrl, true)}
          allow="autoplay"
        />
      ) : null}

      <section className={styles.shelf} aria-label="Published mixes">
        <p className={styles.shelfLabel}>Published</p>
        {mixes.length === 0 ? (
          <p className={styles.empty}>Published SoundCloud mixes load here. None are published in this view.</p>
        ) : (
          <div className={styles.sleeves} role="radiogroup" aria-label="Published mixes">
            {mixes.map((mix, index) => {
              const selected = mix.id === activeId
              return (
                <button
                  key={mix.id}
                  ref={(node) => { sleeveRefs.current[index] = node }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (activeId === null && index === 0) ? 0 : -1}
                  className={selected ? styles.sleeveOn : styles.sleeve}
                  onClick={() => load(mix, index)}
                  onKeyDown={(event) => onSleeveKey(event, index)}
                >
                  <span className={styles.sleeveVisual}>
                    <span className={styles.sleeveDisc} aria-hidden="true" />
                    <span className={styles.sleeveStack} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className={styles.cover}>
                      {mix.coverUrl && coverHostOk(mix.coverUrl) ? (
                        <Image src={mix.coverUrl} alt="" fill sizes="180px" />
                      ) : mix.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mix.coverUrl} alt="" />
                      ) : (
                        <span>{mix.title}</span>
                      )}
                      <span className={styles.spine} aria-hidden="true" />
                    </span>
                  </span>
                  <strong>{mix.title}</strong>
                  {mix.genre ? <em>{mix.genre}</em> : null}
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className={styles.shelf} aria-label="In the lab">
        <p className={styles.shelfLabel}>In the Lab</p>
        <ul className={styles.bench}>
          {labMarks.map((item) => (
            <li key={item.id}>
              <span className={styles.blank} aria-hidden="true">
                <span className={styles.blankDisc} />
                <span className={styles.blankStack}>
                  <i />
                  <i />
                  <i />
                </span>
                <span className={styles.blankJacket} />
              </span>
              <strong>{item.label}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Record({
  buttonRef,
  playing,
  reduced,
  cover,
  title,
  onToggle,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>
  playing: boolean
  reduced: boolean
  cover: string | null
  title: string | null
  onToggle: () => void
}) {
  const discRef = useRef<HTMLSpanElement>(null)
  const motion = useRef({ angle: 0, velocity: 0 })
  const drag = useRef({ active: false, last: 0, moved: 0 })
  const playingRef = useRef(playing)

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

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
      const target = playingRef.current && !drag.current.active ? 160 : 0
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
    return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2))
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.platter}
      aria-pressed={playing}
      aria-label={title ? (playing ? `Pause ${title}` : `Play ${title}`) : 'Empty platter'}
      disabled={!title}
      onPointerDown={(event) => {
        if (!title) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { active: true, last: pointerAngle(event), moved: 0 }
      }}
      onPointerMove={(event) => {
        if (!drag.current.active || reduced) return
        const next = pointerAngle(event)
        let delta = next - drag.current.last
        if (delta > Math.PI) delta -= Math.PI * 2
        if (delta < -Math.PI) delta += Math.PI * 2
        drag.current.last = next
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
      <span className={styles.disc} ref={discRef}>
        <span className={styles.groove} aria-hidden="true" />
        {cover && coverHostOk(cover) ? (
          <span className={styles.label}>
            <Image src={cover} alt="" fill sizes="140px" />
          </span>
        ) : (
          <span className={styles.labelType}>{title ?? ''}</span>
        )}
        <span className={styles.sheen} aria-hidden="true" />
      </span>
      <span className={styles.spindle} aria-hidden="true" />
    </button>
  )
}
