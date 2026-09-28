'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import styles from './HangingLogo.module.css'

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
  const [kicked, setKicked] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  function kick(event: PointerEvent<HTMLSpanElement>) {
    event.stopPropagation()
    setDirection((value) => value === 1 ? -1 : 1)

    if (timerRef.current) window.clearTimeout(timerRef.current)
    setKicked(false)

    window.requestAnimationFrame(() => {
      setKicked(true)
      timerRef.current = window.setTimeout(() => setKicked(false), 1350)
    })
  }

  const copy = (layer: string, interactive = false) => (
    <span
      className={`${styles.swing} ${layer}${kicked ? ` ${styles.kicked}` : ''}`}
      style={{ '--kick-dir': direction } as CSSProperties}
      data-route-swipe-block={interactive ? true : undefined}
      onPointerDown={interactive ? kick : undefined}
    >
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
      {copy(styles.front, true)}
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
