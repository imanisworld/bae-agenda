'use client'

/**
 * LAB — crate + turntable.
 * Crates are DJ B.A.E.'s public SoundCloud playlists (see LAB_CRATES). A 3D
 * cover carousel (swipe / drag / arrows / trackpad) feeds a picture-disc
 * turntable. Audio runs through the site-wide PlayerProvider so it keeps
 * playing after the visitor leaves the Lab.
 */
import { HangFrom } from '@/components/public/brand/HangingLogo'
import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { permalinkFor, usePlayer } from '@/components/public/player/PlayerProvider'
import { useLabCrates, type CrateMix } from '@/components/public/player/useLabCrates'
import styles from './LabListeningStation.module.css'

export type ListeningMix = CrateMix

const SOUNDCLOUD_PROFILE = 'https://soundcloud.com/deejaybae'
const SWIPE_THRESHOLD = 40

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function shortestAngleDelta(next: number, prev: number) {
  let delta = next - prev
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

function formatTime(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

function coverStyle(offset: number): CSSProperties {
  const abs = Math.abs(offset)
  const side = Math.sign(offset)
  // Center cover faces forward; the rest angle toward it and step back in depth.
  const x = offset === 0 ? 0 : side * (0.64 + (abs - 1) * 0.3)
  return {
    '--x': x,
    '--z': offset === 0 ? 1 : -abs,
    '--ry': offset === 0 ? '0deg' : `${side * -54}deg`,
    zIndex: 20 - abs,
    opacity: abs > 3 ? 0 : 1,
    pointerEvents: abs > 3 ? 'none' : undefined,
  } as CSSProperties
}

function PlayIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5Z" /></svg>
}

function PauseIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3" width="3" height="10" rx="1" /><rect x="9" y="3" width="3" height="10" rx="1" /></svg>
}

export default function LabListeningStation({ mixes }: { mixes: ListeningMix[] }) {
  const player = usePlayer()
  const { cue } = player
  const { status: cratesStatus, crates } = useLabCrates(mixes)
  const [crateKey, setCrateKey] = useState<string | null>(null)
  const [focus, setFocus] = useState(0)
  const [shareNote, setShareNote] = useState('')
  const [draggingCovers, setDraggingCovers] = useState(false)
  const [scratching, setScratching] = useState(false)
  const drag = useRef<{ x: number; moved: boolean; pointerId: number } | null>(null)
  const scratch = useRef<{ pointerId: number; lastAngle: number; moved: boolean } | null>(null)
  const scratchAngle = useRef(0)
  const suppressDeckClick = useRef(false)
  const wheelLock = useRef(0)
  const turntableRef = useRef<HTMLButtonElement | null>(null)

  const crate = crates.find((item) => item.key === crateKey) ?? crates[0] ?? null
  const list = crate?.mixes ?? []

  // Put the first crate's lead mix on the platter so the first tap plays instantly.
  useEffect(() => {
    if (crates[0]?.mixes.length) cue(crates[0].mixes)
  }, [crates, cue])

  // The crate follows the player: returning mid-mix, or next / previous,
  // brings the playing cover (and its crate) to the front.
  const currentId = player.current?.id
  const [followedId, setFollowedId] = useState<string | undefined>(undefined)
  if (crates.length > 0 && currentId !== followedId) {
    setFollowedId(currentId)
    const home = crates.find((item) => item.mixes.some((mix) => mix.id === currentId))
    if (home) {
      setCrateKey(home.key)
      setFocus(home.mixes.findIndex((mix) => mix.id === currentId))
    }
  }

  const focused = list[focus] ?? null
  const playing = player.status === 'playing'
  const onPlatter = player.status === 'playing' || player.status === 'loading'
  // While music plays the deck shows the playing mix; otherwise it shows the
  // cover at the front of the crate, so the big play button plays what you see.
  const loaded = (onPlatter ? (player.current as ListeningMix | null) : focused) ?? focused ?? list[0] ?? null
  const loadedIsCurrent = Boolean(loaded && loaded.id === currentId)
  const loadedIndex = loaded ? list.findIndex((mix) => mix.id === loaded.id) : -1
  const duration = loadedIsCurrent && player.duration ? player.duration : (loaded?.duration ?? 0) * 1000
  const position = loadedIsCurrent ? player.position : 0
  const progress = duration ? Math.min(1, position / duration) : 0
  const canPlay = Boolean(loaded)
  const loadedPermalink = loadedIsCurrent ? player.permalink : permalinkFor(loaded?.embed_url ?? null)

  /** Play / pause whatever the deck is showing. */
  function deckToggle() {
    if (!loaded) return
    if (loadedIsCurrent && player.engaged) {
      player.toggle()
      return
    }
    const i = list.findIndex((mix) => mix.id === loaded.id)
    if (i >= 0) player.playFrom(list, i)
  }

  function chooseCrate(key: string) {
    const next = crates.find((item) => item.key === key)
    if (!next) return
    setCrateKey(key)
    const i = next.mixes.findIndex((mix) => mix.id === currentId)
    setFocus(i >= 0 ? i : 0)
  }

  function move(step: number) {
    setFocus((value) => Math.max(0, Math.min(list.length - 1, value + step)))
  }

  function putOn(index: number) {
    const mix = list[index]
    if (!mix) return
    if (mix.id === currentId && player.engaged) player.toggle()
    else player.playFrom(list, index)
  }

  function onCoverClick(index: number) {
    if (drag.current?.moved) return
    if (index === focus) putOn(index)
    else setFocus(index)
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    drag.current = { x: event.clientX, moved: false, pointerId: event.pointerId }
    setDraggingCovers(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.style.setProperty('--drag-px', '0px')
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) > 8) start.moved = true
    event.currentTarget.style.setProperty('--drag-px', `${clamp(dx * .55, -86, 86)}px`)
  }

  function finishCoverDrag(event: React.PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    const dx = event.clientX - start.x

    event.currentTarget.style.setProperty('--drag-px', '0px')
    setDraggingCovers(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (!cancelled) {
      if (dx > SWIPE_THRESHOLD) move(-1)
      else if (dx < -SWIPE_THRESHOLD) move(1)
    }

    window.setTimeout(() => { drag.current = null }, 0)
  }

  function recordPointerAngle(event: React.PointerEvent<HTMLSpanElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return Math.atan2(event.clientY - cy, event.clientX - cx) * 180 / Math.PI
  }

  function onRecordPointerDown(event: React.PointerEvent<HTMLSpanElement>) {
    event.stopPropagation()
    scratchAngle.current = 0
    scratch.current = {
      pointerId: event.pointerId,
      lastAngle: recordPointerAngle(event),
      moved: false,
    }
    setScratching(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onRecordPointerMove(event: React.PointerEvent<HTMLSpanElement>) {
    const current = scratch.current
    if (!current || current.pointerId !== event.pointerId) return

    const angle = recordPointerAngle(event)
    const delta = shortestAngleDelta(angle, current.lastAngle) * .82
    current.lastAngle = angle
    if (Math.abs(delta) > .7) current.moved = true

    scratchAngle.current += delta
    event.currentTarget.style.setProperty('--scratch-angle', `${scratchAngle.current}deg`)
    turntableRef.current?.style.setProperty('--scratch-react', `${clamp(delta * .16, -3, 3)}deg`)
  }

  function finishRecordDrag(event: React.PointerEvent<HTMLSpanElement>) {
    const current = scratch.current
    if (!current || current.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (current.moved) suppressDeckClick.current = true
    scratch.current = null
    scratchAngle.current = 0
    setScratching(false)
    event.currentTarget.style.setProperty('--scratch-angle', '0deg')
    turntableRef.current?.style.setProperty('--scratch-react', '0deg')
  }

  function onTurntableClick() {
    if (suppressDeckClick.current) {
      suppressDeckClick.current = false
      return
    }
    deckToggle()
  }

  function onWheel(event: React.WheelEvent) {
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY) || Math.abs(event.deltaX) < 12) return
    const now = Date.now()
    if (now - wheelLock.current < 320) return
    wheelLock.current = now
    move(event.deltaX > 0 ? 1 : -1)
  }

  function onCrateKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
  }

  // Keep the carousel in step with the transport's next / previous.
  function transport(step: 1 | -1) {
    if (step === 1) player.next()
    else player.previous()
  }

  async function share() {
    if (!loaded) return
    const url = loadedPermalink || `${window.location.origin}/lab`
    const data = { title: `${loaded.title} — DJ B.A.E.`, url }
    try {
      if (navigator.share) {
        await navigator.share(data)
        return
      }
      await navigator.clipboard.writeText(url)
      setShareNote('Link copied')
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return
      setShareNote('Could not share')
    }
    window.setTimeout(() => setShareNote(''), 2200)
  }

  const header = (
    <header className={styles.header}>
      <div>
        <p>Bae&apos;s in the Lab</p>
        <h1><HangFrom finish="chrome">O</HangFrom>n wax.</h1>
      </div>
      {crates.length > 1 ? (
        <div className={styles.crateSwitch} role="group" aria-label="Choose a crate">
          {crates.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={item.key === crate?.key}
              onClick={() => chooseCrate(item.key)}
            >
              {item.label}
              <small>{item.mixes.length}</small>
            </button>
          ))}
        </div>
      ) : crates.length === 1 ? (
        <span>{String(list.length).padStart(2, '0')} mixes</span>
      ) : null}
    </header>
  )

  if (cratesStatus === 'loading') {
    return (
      <section className={styles.station} aria-label="B.A.E. listening station" aria-busy="true">
        {header}
        <div className={styles.crate}>
          <div className={styles.coverflow} aria-hidden="true">
            {[-1, 0, 1].map((offset) => (
              <span key={offset} className={`${styles.cover} ${styles.skeleton}`} style={coverStyle(offset)} />
            ))}
          </div>
          <div className={styles.crateBar}>
            <div className={styles.crateCaption}>
              <small>SoundCloud</small>
              <strong>Loading mixes…</strong>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!loaded) {
    return (
      <section className={styles.station} aria-label="B.A.E. listening station">
        {header}
        <div className={styles.empty}>
          <span>Nothing here yet</span>
          <h2>New mixes will show up here.</h2>
          <a href={SOUNDCLOUD_PROFILE} target="_blank" rel="noopener noreferrer">Follow on SoundCloud →</a>
        </div>
      </section>
    )
  }

  const focusedIsLoaded = focused?.id === loaded.id

  return (
    <section className={styles.station} aria-label="B.A.E. listening station">
      {header}

      {/* ── Crate: 3D cover carousel ── */}
      <div className={styles.crate}>
        <div
          key={crate?.key}
          className={`${styles.coverflow}${draggingCovers ? ` ${styles.coverflowDragging}` : ''}`}
          role="listbox"
          aria-label={`${crate?.label ?? 'Mixes'} — use arrow keys or swipe to browse`}
          aria-activedescendant={focused ? `lab-cover-${focused.id}` : undefined}
          tabIndex={0}
          onKeyDown={onCrateKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => finishCoverDrag(event)}
          onPointerCancel={(event) => finishCoverDrag(event, true)}
          onWheel={onWheel}
        >
          {list.map((mix, index) => {
            const offset = index - focus
            const isLoaded = index === loadedIndex
            return (
              <button
                type="button"
                key={mix.id}
                id={`lab-cover-${mix.id}`}
                role="option"
                aria-selected={offset === 0}
                aria-label={offset === 0 ? `${mix.title} — ${isLoaded && playing ? 'pause' : 'play'}` : `Show ${mix.title}`}
                tabIndex={-1}
                className={`${styles.cover}${offset === 0 ? ` ${styles.coverFront}` : ''}`}
                style={coverStyle(offset)}
                onClick={() => onCoverClick(index)}
              >
                <span className={styles.coverArt}>
                  {/* Only covers near the front load an image; far ones are invisible anyway. */}
                  {mix.cover_url && Math.abs(offset) <= 3 ? (
                    <Image src={mix.cover_url} alt="" fill sizes="(max-width: 620px) 50vw, 280px" quality={90} draggable={false} />
                  ) : (
                    <span className={styles.coverFallback}>DJ B.A.E.</span>
                  )}
                </span>
                {offset === 0 ? (
                  <span className={styles.coverBadge} aria-hidden="true">
                    {isLoaded && playing ? <PauseIcon /> : <PlayIcon />}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className={styles.crateBar}>
          <button type="button" className={styles.round} onClick={() => move(-1)} disabled={focus === 0} aria-label="Previous cover">←</button>
          <div className={styles.crateCaption} aria-live="polite">
            <small>{String(focus + 1).padStart(3, '0')}{focused?.genre ? ` · ${focused.genre}` : ''}</small>
            <strong>{focused?.title}</strong>
            <span>{focusedIsLoaded && onPlatter ? 'On the platter' : `${focus + 1} of ${list.length} · tap the cover to play`}</span>
          </div>
          <button type="button" className={styles.round} onClick={() => move(1)} disabled={focus === list.length - 1} aria-label="Next cover">→</button>
        </div>
      </div>

      {/* ── Deck: picture-disc turntable + transport ── */}
      <div className={`${styles.deck}${playing ? ` ${styles.deckPlaying}` : ''}`}>
        <button
          ref={turntableRef}
          type="button"
          className={`${styles.turntable}${scratching ? ` ${styles.turntableScratching}` : ''}`}
          onClick={onTurntableClick}
          disabled={!canPlay}
          aria-label={playing ? `Pause ${loaded.title}` : `Play ${loaded.title}`}
        >
          <span className={styles.platter}>
            <span
              key={loaded.id}
              className={styles.recordGrip}
              onPointerDown={onRecordPointerDown}
              onPointerMove={onRecordPointerMove}
              onPointerUp={finishRecordDrag}
              onPointerCancel={finishRecordDrag}
              aria-hidden="true"
            >
              <span className={`${styles.record}${playing ? ` ${styles.spinning}` : ''}`}>
                {loaded.cover_url ? (
                  <Image src={loaded.cover_url} alt="" fill sizes="(max-width: 620px) 40vw, 320px" quality={90} draggable={false} />
                ) : null}
                <span className={styles.grooves} aria-hidden="true" />
                <span className={styles.hole} aria-hidden="true" />
              </span>
            </span>
          </span>
          <span className={`${styles.tonearm}${onPlatter ? ` ${styles.tonearmOn}` : ''}`} aria-hidden="true">
            <i />
          </span>
        </button>

        <div className={styles.console}>
          <div className={styles.readout}>
            <span className={styles.state}>
              <i className={playing ? styles.liveDot : styles.idleDot} />
              {player.status === 'loading' ? 'Dropping the needle' : playing ? 'Now spinning' : loadedIsCurrent && player.engaged ? 'Paused' : 'Cued up'}
            </span>
            <h2>{loaded.title}</h2>
            <p>{[loaded.genre || 'Open format', loaded.description].filter(Boolean).join(' · ')}</p>
          </div>

          <div className={styles.progress}>
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(progress * 1000)}
              onChange={(event) => player.seek(Number(event.target.value) / 1000)}
              disabled={!loadedIsCurrent || !player.engaged || !duration}
              aria-label="Seek"
              aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
              style={{ '--progress': `${progress * 100}%` } as CSSProperties}
            />
            <div className={styles.times}>
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className={styles.controls}>
            <div className={styles.transport}>
              <button type="button" className={styles.round} onClick={() => transport(-1)} disabled={!player.engaged} aria-label="Previous mix or restart">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v10M13 3.6v8.8a.6.6 0 0 1-.9.5L6 8.5a.6.6 0 0 1 0-1l6.1-4.4a.6.6 0 0 1 .9.5Z" /></svg>
              </button>
              <button type="button" className={styles.play} onClick={deckToggle} disabled={!canPlay} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button type="button" className={styles.round} onClick={() => transport(1)} disabled={player.queue.length < 2} aria-label="Next mix">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12 3v10M3 3.6v8.8a.6.6 0 0 0 .9.5L10 8.5a.6.6 0 0 0 0-1L3.9 3.1a.6.6 0 0 0-.9.5Z" /></svg>
              </button>
            </div>

            <div className={styles.links}>
              <button type="button" onClick={share}>{shareNote || 'Share'}</button>
              <a href={loadedPermalink || SOUNDCLOUD_PROFILE} target="_blank" rel="noopener noreferrer">
                SoundCloud
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
