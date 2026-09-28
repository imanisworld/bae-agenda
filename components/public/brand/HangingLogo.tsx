/**
 * The DJ B.A.E. tag, hooked by its own carabiner onto something on the page
 * and swinging gently. Purely decorative: it never takes clicks or focus.
 *
 * The tag is drawn twice with the same swing: a full copy behind the thing it
 * hangs from, and a front copy with the clasp's gate cut away — so the letter
 * stroke (or photo edge) reads as threaded through the clasp's slot.
 *
 * <HangingLogo /> hangs from the top-left corner of its nearest positioned
 * parent (place it with CSS; that parent needs its own stacking context).
 * <HangFrom> wraps one letter of a headline and hooks onto its bottom stroke.
 */
import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import styles from './HangingLogo.module.css'

/**
 * Each finish of the tag. `clasp` is the top of the clasp and `slot` the middle
 * of its opening, both as a share of the image's width.
 */
const FINISHES = {
  red: { src: '/brand/dj-bae-logo.png', height: 659, clasp: '15.5%', slot: '14.8%' },
  gold: { src: '/brand/dj-bae-logo-gold.png', height: 660, clasp: '15.8%', slot: '14.8%' },
  silver: { src: '/brand/dj-bae-logo-silver.png', height: 673, clasp: '16.1%', slot: '17%' },
  chrome: { src: '/brand/dj-bae-logo-chrome.png', height: 645, clasp: '17.1%', slot: '17.3%' },
} as const

export type LogoFinish = keyof typeof FINISHES

type Props = { finish?: LogoFinish; className?: string }

export function HangingLogo({ finish = 'red', className }: Props) {
  const tag = FINISHES[finish]
  const copy = (layer: string) => (
    <span className={`${styles.swing} ${layer}`}>
      <Image src={tag.src} alt="" width={900} height={tag.height} sizes="120px" className={styles.logo} />
    </span>
  )
  return (
    <span
      className={`${styles.hanger} ${className ?? ''}`}
      style={{ '--clasp': tag.clasp, '--slot': tag.slot } as CSSProperties}
      aria-hidden="true"
    >
      {copy(styles.back)}
      {copy(styles.front)}
    </span>
  )
}

export function HangFrom({ children, finish, className }: Props & { children: ReactNode }) {
  return (
    <span className={styles.letter}>
      {children}
      <HangingLogo finish={finish} className={`${styles.fromLetter} ${className ?? ''}`} />
    </span>
  )
}
