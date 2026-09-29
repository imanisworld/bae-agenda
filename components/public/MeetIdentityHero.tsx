'use client'

import { HangFrom } from '@/components/public/brand/HangingLogo'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import styles from './MeetIdentityHero.module.css'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function MeetIdentityHero() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [interacting, setInteracting] = useState(false)
  const pointerRef = useRef<number | null>(null)

  function updateTilt(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - .5) * 13
    const y = ((event.clientY - rect.top) / rect.height - .5) * -10
    setTilt({ x: clamp(x, -7, 7), y: clamp(y, -5, 5) })
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
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
        className={`${styles.portraitWrap}${interacting ? ` ${styles.portraitInteracting}` : ''}`}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' && pointerRef.current === null) finish()
        }}
      >
        <div className={styles.portrait}>
          <Image
            src="/photos/images/logo.JPG"
            alt="DJ B.A.E. portrait"
            fill
            priority
            sizes="(max-width: 760px) 88vw, 44vw"
            quality={95}
            draggable={false}
          />
        </div>
      </div>

      <div className={styles.copy}>
        <div className={styles.title}>
          <h1 id="meet-title">Get to kn<HangFrom finish="gold">o</HangFrom>w</h1>
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
            <Link href="/book" className="btn-primary">Book DJ B.A.E.</Link>
            <Link href="/press-kit" className="btn-ghost">Open Press Kit</Link>
          </div>
        </div>
      </div>

      <div className={styles.rule} aria-hidden="true" />
    </section>
  )
}
