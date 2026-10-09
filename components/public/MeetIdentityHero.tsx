'use client'

import { HangFrom } from '@/components/public/brand/HangingLogo'
import InteractionCue, { markCueUsed, useMotionHint } from '@/components/public/InteractionCue'
import Image from 'next/image'
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import styles from './MeetIdentityHero.module.css'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function MeetIdentityHero() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [interacting, setInteracting] = useState(false)
  const pointerRef = useRef<number | null>(null)
  const hint = useMotionHint('meet-portrait')

  function updateTilt(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - .5) * 13
    const y = ((event.clientY - rect.top) / rect.height - .5) * -10
    setTilt({ x: clamp(x, -7, 7), y: clamp(y, -5, 5) })
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    markCueUsed('meet-portrait')
    hint.finish()
    pointerRef.current = event.pointerId
    setInteracting(true)
    updateTilt(event)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' || pointerRef.current === event.pointerId) {
      updateTilt(event)
    }
  }

  function finish(event?: PointerEvent<HTMLDivElement>) {
    if (event && pointerRef.current === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    pointerRef.current = null
    setInteracting(false)
    setTilt({ x: 0, y: 0 })
  }

  return (
    <section
      className={styles.hero}
      aria-labelledby="meet-title"
      style={{
        '--tilt-x': `${tilt.x}deg`,
        '--tilt-y': `${tilt.y}deg`,
      } as CSSProperties}
    >
      <div className={styles.glow} aria-hidden="true" />

      <div
        data-route-swipe-block
        data-cue-host
        className={`${styles.portraitWrap}${interacting ? ` ${styles.portraitInteracting}` : ''}${hint.active ? ` ${styles.portraitHint}` : ''}`}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onAnimationEnd={(event) => {
          if ((event.target as HTMLElement).classList.contains(styles.portrait)) hint.finish()
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' && pointerRef.current === null) finish()
        }}
      >
        <div className={styles.portrait}>
          {/* Same portrait in every layer: a reconstructed torn magazine print,
              never unrelated photos or separately generated faces. */}
          <span className={styles.portraitPaper}>
            <Image
              src="/photos/images/portrait.jpg"
              alt="DJ B.A.E. portrait"
              fill
              priority
              sizes="(max-width: 760px) 88vw, 44vw"
              quality={90}
              draggable={false}
            />
            <span className={`${styles.portraitPiece} ${styles.portraitPieceLeft}`} aria-hidden="true">
              <Image src="/photos/images/portrait.jpg" alt="" fill sizes="(max-width: 760px) 88vw, 44vw" draggable={false} />
            </span>
            <span className={`${styles.portraitPiece} ${styles.portraitPieceRight}`} aria-hidden="true">
              <Image src="/photos/images/portrait.jpg" alt="" fill sizes="(max-width: 760px) 88vw, 44vw" draggable={false} />
            </span>
            <svg className={styles.portraitTears} viewBox="0 0 1000 750" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M308 -8 L299 90 L313 168 L297 255 L310 345 L295 420 L307 505 L291 595 L300 760" />
              <path d="M764 -8 L751 102 L766 184 L752 286 L766 372 L751 470 L770 576 L748 760" />
              <path d="M0 531 L121 516 L298 522 L414 511 L566 536 L681 522 L754 535 L879 517 L1000 528" />
              <path d="M303 206 L397 197 L511 210 L637 195 L765 207" />
            </svg>
            <span className={styles.portraitTapeOne} aria-hidden="true" />
            <span className={styles.portraitTapeTwo} aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className={styles.copy}>
        <div className={styles.title}>
          <h1 id="meet-title">Get to kn<HangFrom finish="gold" className={styles.titleTag}>o</HangFrom>w</h1>
        </div>

        <div className={styles.details}>
          <div className={styles.summary}>
            I move across genres with intention, read the room, and build the set around the people in front of me.
          </div>

          <div className={styles.signals} aria-label="DJ B.A.E. profile highlights">
            <span>Open format</span>
            <span>Reads the room</span>
            <span>Available to travel</span>
          </div>

          <div className={styles.actions}>
            <a href="/book#inquiry" className="btn-primary" data-route-swipe-block>Book DJ B.A.E.</a>
            <a href="/press-kit" className="btn-ghost">Open Press Kit</a>
          </div>
        </div>
      </div>

      <div className={styles.rule} aria-hidden="true" />
    </section>
  )
}
