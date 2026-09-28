'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type CSSProperties, type PointerEvent } from 'react'
import styles from './MeetIdentityHero.module.css'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function MeetIdentityHero() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - .5) * 11
    const y = ((event.clientY - rect.top) / rect.height - .5) * -8
    setTilt({ x: clamp(x, -6, 6), y: clamp(y, -4, 4) })
  }

  return (
    <section
      className={styles.hero}
      aria-labelledby="meet-title"
      onPointerMove={move}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        '--tilt-x': `${tilt.x}deg`,
        '--tilt-y': `${tilt.y}deg`,
      } as CSSProperties}
    >
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.portraitWrap}>
        <div className={styles.portrait}>
          <Image
            src="/photos/images/logo.JPG"
            alt="DJ B.A.E. portrait"
            fill
            priority
            sizes="(max-width: 760px) 82vw, 44vw"
            quality={95}
          />
        </div>
        <span className={styles.portraitLabel}>DJ B.A.E.</span>
      </div>

      <div className={styles.copy}>
        <div className={styles.title}>
          <p>Indianapolis</p>
          <h1 id="meet-title">Meet<br /> DJ B.A.E.</h1>
        </div>

        <div className={styles.details}>
          <div className={styles.summary}>
            Open-format selection, room-aware pacing, and sets built around the people actually in front of the booth.
          </div>

          <div className={styles.signals} aria-label="DJ B.A.E. profile highlights">
            <span>Open format</span>
            <span>Room-aware pacing</span>
            <span>Travel-ready</span>
          </div>

          <div className={styles.actions}>
            <Link href="/book" className="btn-primary">Book DJ B.A.E.</Link>
            <Link href="/press-kit" className="btn-ghost">Open Press Kit</Link>
          </div>
        </div>
      </div>

      <div className={styles.phone} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/images/phone%203d%20.gif" alt="" />
      </div>

      <div className={styles.rule} aria-hidden="true" />
    </section>
  )
}
