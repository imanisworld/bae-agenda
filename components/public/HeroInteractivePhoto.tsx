'use client'

import Image from 'next/image'
import InteractionCue, { markCueUsed, useMotionHint } from '@/components/public/InteractionCue'
import { useState, type CSSProperties, type PointerEvent } from 'react'
import styles from './HeroSection.module.css'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function HeroInteractivePhoto() {
  const [recordOut, setRecordOut] = useState(false)
  const hint = useMotionHint('home-sleeve')

  function tilt(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - .5
    const py = (event.clientY - rect.top) / rect.height - .5
    event.currentTarget.style.setProperty('--photo-ry', `${clamp(px * 8, -4, 4)}deg`)
    event.currentTarget.style.setProperty('--photo-rx', `${clamp(py * -6, -3, 3)}deg`)
    event.currentTarget.style.setProperty('--shine-x', `${50 + px * 24}%`)
  }

  function settle(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.setProperty('--photo-ry', '0deg')
    event.currentTarget.style.setProperty('--photo-rx', '0deg')
    event.currentTarget.style.setProperty('--shine-x', '50%')
  }

  return (
    <button
      type="button"
      className={`${styles.photo}${recordOut ? ` ${styles.photoOpen}` : ''}${hint.active ? ` ${styles.photoHint}` : ''}`}
      onPointerMove={tilt}
      onPointerLeave={settle}
      onAnimationEnd={(event) => {
        if ((event.target as HTMLElement).classList.contains(styles.vinyl)) hint.finish()
      }}
      onClick={() => {
        markCueUsed('home-sleeve')
        setRecordOut((value) => !value)
      }}
      aria-pressed={recordOut}
      data-cue-host
      aria-label={recordOut ? 'Slide the vinyl record back into the DJ B.A.E. sleeve' : 'Slide the vinyl record out of the DJ B.A.E. sleeve'}
      style={{
        '--photo-rx': '0deg',
        '--photo-ry': '0deg',
        '--shine-x': '50%',
      } as CSSProperties}
    >
      <span className={styles.albumStack}>
        <span className={styles.vinyl} aria-hidden="true">
          <span className={styles.vinylGrooves} />
          <span className={styles.vinylLabel}>
            <small>THE BAE AGENDA</small>
            <strong>DJ B.A.E.</strong>
          </span>
        </span>

        <span className={styles.photoFrame}>
          <Image
            src="/photos/images/outside.jpg"
            alt="DJ B.A.E. performing"
            fill
            priority
            sizes="(max-width: 900px) 72vw, 40vw"
            quality={90}
            className={styles.photoImage}
          />
          <span className={styles.photoSheen} aria-hidden="true" />
        </span>
        <InteractionCue id="home-sleeve" label="Tap" className={styles.sleeveCue} />
      </span>
    </button>
  )
}
