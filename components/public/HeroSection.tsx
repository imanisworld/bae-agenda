/**
 * Approved homepage hero — Editorial Cutout.
 * One performance image, oversized BAE typography, and restrained brand copy.
 */
import Link from 'next/link'
import HeroInteractivePhoto from '@/components/public/HeroInteractivePhoto'
import styles from './HeroSection.module.css'

interface HeroContent {
  hero_title?: string
  hero_subtitle?: string
}

interface Props {
  content?: HeroContent
}

export default function HeroSection({ content = {} }: Props) {
  const accessibleTitle = content.hero_title?.trim() || 'DJ B.A.E.'

  return (
    <section
      id="home"
      aria-label={`${accessibleTitle} — Selector, Genre Bender, Sound Architect`}
      className={styles.hero}
    >
      <div className={styles.wordmark} aria-hidden="true">BAE</div>
      {/* Outline copy sits above the photo so the letters still read where the photo covers them. */}
      <div className={`${styles.wordmark} ${styles.wordmarkOutline}`} aria-hidden="true">BAE</div>

      <HeroInteractivePhoto />

      <div className={styles.copy}>
        <p className={styles.eyebrow}>Selector · Genre Bender</p>
        <h1>Sound<br />Architect</h1>
        <p className={styles.meta}>Indianapolis · Open format</p>

        <div className={styles.actions}>
          <Link href="/book" className="btn-primary">Book DJ B.A.E. →</Link>
          <Link href="/portfolio" className="btn-ghost">Past Work</Link>
        </div>
      </div>

      <div className={styles.rule} aria-hidden="true" />
    </section>
  )
}
