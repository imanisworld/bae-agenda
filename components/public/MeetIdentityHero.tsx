'use client'

import Image from 'next/image'
import Link from 'next/link'
import styles from './MeetIdentityHero.module.css'

export default function MeetIdentityHero() {
  return (
    <section className={styles.hero} aria-labelledby="meet-title">
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.portraitWrap}>
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
          <p>Indianapolis</p>
          <div className={styles.titleRow}>
            <h1 id="meet-title">Meet<br /> DJ B.A.E.</h1>
            <div className={styles.phone} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/phone-3d.webp" alt="" width={241} height={420} />
            </div>
          </div>
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
