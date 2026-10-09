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
          {/* One original photograph, reassembled into torn magazine-paper layers.
              Keep every piece cropped from this SAME source, never other photos. */}
          <span className={styles.coverArtwork}>
            <Image
              src="/photos/images/outside.jpg"
              alt="DJ B.A.E. performing"
              fill
              priority
              draggable={false}
              sizes="(max-width: 900px) 72vw, 40vw"
              quality={90}
              className={styles.photoImage}
            />
            <span className={`${styles.tornPanel} ${styles.tornPanelLeft}`} aria-hidden="true">
              <Image src="/photos/images/outside.jpg" alt="" fill draggable={false} sizes="(max-width: 900px) 72vw, 40vw" className={styles.tornPhoto} />
            </span>
            <span className={`${styles.tornPanel} ${styles.tornPanelRight}`} aria-hidden="true">
              <Image src="/photos/images/outside.jpg" alt="" fill draggable={false} sizes="(max-width: 900px) 72vw, 40vw" className={styles.tornPhoto} />
            </span>
            <span className={`${styles.tornPanel} ${styles.tornPanelTop}`} aria-hidden="true">
              <Image src="/photos/images/outside.jpg" alt="" fill draggable={false} sizes="(max-width: 900px) 72vw, 40vw" className={styles.tornPhoto} />
            </span>
            {/* Jagged printed-paper seams match the edges of the tonal panels. */}
            <svg className={styles.tornSeams} viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path className={styles.tornEdgeShadow} d="M300 -5 L293 90 L311 160 L294 230 L308 307 L289 387 L301 468 L285 541 L303 619 L291 697 L300 761 L284 844 L296 1005" />
              <path className={styles.tornEdge} d="M300 -5 L293 90 L311 160 L294 230 L308 307 L289 387 L301 468 L285 541 L303 619 L291 697 L300 761 L284 844 L296 1005" />
              <path className={styles.tornEdgeShadow} d="M765 -5 L771 96 L754 176 L768 264 L750 352 L767 450 L755 547 L764 649 L748 734 L758 835 L748 1005" />
              <path className={styles.tornEdge} d="M765 -5 L771 96 L754 176 L768 264 L750 352 L767 450 L755 547 L764 649 L748 734 L758 835 L748 1005" />
              <path className={styles.tornEdgeShadow} d="M295 293 L373 289 L456 304 L539 292 L632 308 L705 294 L765 301" />
              <path className={styles.tornEdge} d="M295 293 L373 289 L456 304 L539 292 L632 308 L705 294 L765 301" />
              <path className={styles.tornEdgeShadow} d="M0 694 L130 681 L291 697 L414 683 L551 702 L680 688 L758 704 L881 687 L1000 700" />
              <path className={styles.tornEdge} d="M0 694 L130 681 L291 697 L414 683 L551 702 L680 688 L758 704 L881 687 L1000 700" />
            </svg>
            <span className={styles.tornTapeTop} aria-hidden="true" />
            <span className={styles.tornTapeBottom} aria-hidden="true" />
          </span>
          <span className={styles.photoSheen} aria-hidden="true" />
        </span>
        <InteractionCue id="home-sleeve" label="Tap" className={styles.sleeveCue} />
      </span>
    </button>
  )
}
