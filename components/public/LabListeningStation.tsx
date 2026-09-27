'use client'

import Image from 'next/image'
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import styles from './LabListeningStation.module.css'

export type ListeningMix = {
  id: string
  title: string
  description: string | null
  genre: string | null
  embed_url: string | null
  cover_url: string | null
}

type SoundCloudWidget = {
  play: () => void
  pause: () => void
  bind: (eventName: string, listener: () => void) => void
}

type SoundCloudNamespace = {
  Widget: ((iframe: HTMLIFrameElement) => SoundCloudWidget) & {
    Events?: Record<string, string>
  }
}

declare global {
  interface Window {
    SC?: SoundCloudNamespace
  }
}

function playerUrl(url: string | null) {
  if (!url) return ''
  if (url.includes('w.soundcloud.com/player')) return url
  if (!url.toLowerCase().includes('soundcloud.com')) return ''
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%238f2d3c&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`
}

export default function LabListeningStation({ mixes }: { mixes: ListeningMix[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [coasting, setCoasting] = useState(false)
  const [apiReady, setApiReady] = useState(false)
  const [loadPulse, setLoadPulse] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<SoundCloudWidget | null>(null)
  const coastTimer = useRef<number | null>(null)

  const active = mixes[activeIndex] ?? null
  const activePlayer = playerUrl(active?.embed_url ?? null)

  useEffect(() => {
    if (!apiReady || !activePlayer || !iframeRef.current || !window.SC) return
    const widget = window.SC.Widget(iframeRef.current)
    widgetRef.current = widget

    const events = window.SC.Widget.Events
    if (events?.PLAY) widget.bind(events.PLAY, () => setPlaying(true))
    if (events?.PAUSE) widget.bind(events.PAUSE, () => setPlaying(false))
    if (events?.FINISH) widget.bind(events.FINISH, () => setPlaying(false))
  }, [apiReady, active?.id, activePlayer])

  useEffect(() => () => {
    if (coastTimer.current !== null) window.clearTimeout(coastTimer.current)
  }, [])

  function choose(index: number) {
    if (index === activeIndex) return
    widgetRef.current?.pause()
    setPlaying(false)
    setCoasting(false)
    setActiveIndex(index)
    setLoadPulse((value) => value + 1)
  }

  function togglePlayback() {
    if (!activePlayer || !widgetRef.current) return
    if (playing) {
      widgetRef.current.pause()
      setPlaying(false)
      setCoasting(true)
      if (coastTimer.current !== null) window.clearTimeout(coastTimer.current)
      coastTimer.current = window.setTimeout(() => setCoasting(false), 1100)
    } else {
      setCoasting(false)
      widgetRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <section className={styles.station} aria-label="B.A.E. listening station">
      <Script
        src="https://w.soundcloud.com/player/api.js"
        strategy="afterInteractive"
        onLoad={() => setApiReady(true)}
        onReady={() => setApiReady(true)}
      />

      <header className={styles.header}>
        <div>
          <p>Bae&apos;s in the Lab</p>
          <h1>Mixes on wax.</h1>
        </div>
        <span>SoundCloud · audio source</span>
      </header>

      {active ? (
        <div className={styles.deck}>
          <div className={styles.platterColumn}>
            <div className={styles.deckLabel}>
              <span className={playing ? styles.liveDot : styles.idleDot} />
              <strong>B.A.E. LISTENING STATION</strong>
              <span>{playing ? 'PLAYING' : coasting ? 'COASTING' : 'READY'}</span>
            </div>

            <button
              type="button"
              className={styles.platter}
              onClick={togglePlayback}
              aria-label={playing ? `Pause ${active.title}` : `Play ${active.title}`}
              disabled={!activePlayer}
            >
              <span className={playing || coasting ? styles.tonearmOn : styles.tonearmOff} aria-hidden="true">
                <i />
              </span>
              <span
                key={`${active.id}-${loadPulse}`}
                className={[
                  styles.record,
                  playing ? styles.recordPlaying : '',
                  coasting ? styles.recordCoasting : '',
                  loadPulse ? styles.recordLoaded : '',
                ].filter(Boolean).join(' ')}
              >
                <span className={styles.grooveOne} />
                <span className={styles.grooveTwo} />
                <span className={styles.label}>
                  {active.cover_url ? (
                    <Image src={active.cover_url} alt="" fill sizes="120px" quality={90} />
                  ) : (
                    <span>BAE</span>
                  )}
                </span>
                <span className={styles.spindle} />
              </span>
            </button>

            <div className={styles.readout} aria-live="polite">
              <span>Now spinning</span>
              <h2>{active.title}</h2>
              <p>{active.genre || 'Open format'}{active.description ? ` · ${active.description}` : ''}</p>
            </div>

            {activePlayer ? (
              <iframe
                key={active.id}
                ref={iframeRef}
                title={`${active.title} SoundCloud player`}
                src={activePlayer}
                allow="autoplay"
                tabIndex={-1}
                aria-hidden="true"
                className={styles.audioFrame}
              />
            ) : (
              <p className={styles.unavailable}>Audio link is not available for this release yet.</p>
            )}
          </div>

          <div className={styles.sleeveColumn}>
            <div className={styles.sleeveHeading}>
              <span>Published mixes</span>
              <strong>{String(mixes.length).padStart(2, '0')}</strong>
            </div>

            <div className={styles.sleeves}>
              {mixes.map((mix, index) => {
                const selected = index === activeIndex
                return (
                  <button
                    type="button"
                    key={mix.id}
                    className={selected ? styles.sleeveActive : styles.sleeve}
                    aria-pressed={selected}
                    onClick={() => choose(index)}
                  >
                    <span className={styles.sleeveVisual}>
                      <span className={styles.sleeveDisc} aria-hidden="true" />
                      <span className={styles.sleeveStack} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className={styles.sleeveArt}>
                        {mix.cover_url ? (
                          <Image src={mix.cover_url} alt="" fill sizes="260px" quality={90} />
                        ) : (
                          <span className={styles.sleeveFallback}>DJ B.A.E.</span>
                        )}
                      </span>
                    </span>
                    <span className={styles.sleeveMeta}>
                      <small>{String(index + 1).padStart(3, '0')}</small>
                      <strong>{mix.title}</strong>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className={styles.comingSoon}>
              <div className={styles.comingSoonIntro}>
                <span>In the Lab</span>
                <p>Unreleased work stays visibly separate from published SoundCloud mixes.</p>
              </div>
              <div className={styles.futureSleeves}>
                <div className={styles.futureSleeve}>
                  <span className={styles.futureVisual} aria-hidden="true">
                    <span className={styles.futureDisc} />
                    <span className={styles.futureStack}>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className={styles.futureJacket} />
                  </span>
                  <span className={styles.futureLabel}>COMING SOON</span>
                </div>
                <div className={styles.futureSleeve}>
                  <span className={styles.futureVisual} aria-hidden="true">
                    <span className={styles.futureDisc} />
                    <span className={styles.futureStack}>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className={styles.futureJacket} />
                  </span>
                  <span className={styles.futureLabel}>WORK IN PROGRESS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.empty}>
          <span>Archive empty</span>
          <h2>New mixes will land here.</h2>
          <a href="https://soundcloud.com/deejaybae" target="_blank" rel="noopener noreferrer">Follow on SoundCloud →</a>
        </div>
      )}
    </section>
  )
}
