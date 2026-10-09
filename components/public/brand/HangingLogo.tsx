'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import InteractionCue, { markCueUsed } from '@/components/public/InteractionCue'
import styles from './HangingLogo.module.css'

const FINISHES = {
  red: { src: '/brand/dj-bae-logo.png', height: 659, clasp: '15.5%', slot: '14.8%' },
  gold: { src: '/brand/dj-bae-logo-gold.png', height: 660, clasp: '15.8%', slot: '14.8%' },
  silver: { src: '/brand/dj-bae-logo-silver.png', height: 673, clasp: '16.1%', slot: '17%' },
  chrome: { src: '/brand/dj-bae-logo-chrome.png', height: 645, clasp: '17.1%', slot: '17.3%' },
} as const

const CUE_ID = 'hanging-logo'

export type LogoFinish = keyof typeof FINISHES

/** `cue` shows the phone-only DRAG hint; turn it off where a page has a second tag. */
type Props = { finish?: LogoFinish; className?: string; cue?: boolean }

export function HangingLogo({ finish = 'red', className, cue = true }: Props) {
  const tag = FINISHES[finish]
  const [kicked, setKicked] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [dragAngle, setDragAngle] = useState(0)
  const [releaseAngle, setReleaseAngle] = useState(0)
  const timerRef = useRef<number | null>(null)
  const pointerRef = useRef<number | null>(null)
  const startXRef = useRef(0)
  const dragAngleRef = useRef(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  function startDrag(event: PointerEvent<HTMLSpanElement>) {
    event.stopPropagation()
    markCueUsed(CUE_ID)
    pointerRef.current = event.pointerId
    startXRef.current = event.clientX
    setDragging(true)
    dragAngleRef.current = 0
    setDragAngle(0)

    if (timerRef.current) window.clearTimeout(timerRef.current)
    setKicked(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function drag(event: PointerEvent<HTMLSpanElement>) {
    if (pointerRef.current !== event.pointerId) return
    const angle = Math.max(-32, Math.min(32, (event.clientX - startXRef.current) * .28))
    dragAngleRef.current = angle
    setDragAngle(angle)
  }

  function finishDrag(event: PointerEvent<HTMLSpanElement>) {
    if (pointerRef.current !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    pointerRef.current = null
    setDragging(false)
    const finalAngle = dragAngleRef.current
    setReleaseAngle(finalAngle)

    const nextDirection: 1 | -1 = Math.abs(finalAngle) > 2
      ? (finalAngle >= 0 ? 1 : -1)
      : (direction === 1 ? -1 : 1)

    setDirection(nextDirection)
    dragAngleRef.current = 0
    setDragAngle(0)
    setKicked(false)

    window.requestAnimationFrame(() => {
      setKicked(true)
      timerRef.current = window.setTimeout(() => setKicked(false), 900)
    })
  }

  const copy = (layer: string, interactive = false) => (
    <span
      className={`${styles.swing} ${layer}${kicked ? ` ${styles.kicked}` : ''}${dragging ? ` ${styles.dragging}` : ''}`}
      style={{
        '--kick-dir': direction,
        '--drag-angle': `${dragAngle}deg`,
        '--release-angle': `${releaseAngle}deg`,
      } as CSSProperties}
      data-route-swipe-block={interactive || undefined}
      onPointerDown={interactive ? startDrag : undefined}
      onPointerMove={interactive ? drag : undefined}
      onPointerUp={interactive ? finishDrag : undefined}
      onPointerCancel={interactive ? finishDrag : undefined}
    >
      <Image src={tag.src} alt="" width={900} height={tag.height} sizes="120px" className={styles.logo} />
    </span>
  )

  return (
    <span
      className={`${styles.hanger} ${className ?? ''}`}
      data-cue-host={cue || undefined}
      style={{ '--clasp': tag.clasp, '--slot': tag.slot } as CSSProperties}
      aria-hidden="true"
      data-finish={finish}
    >
      {copy(styles.back)}
      {copy(styles.front, true)}
      {cue ? <InteractionCue id={CUE_ID} label="Drag" className={styles.cue} /> : null}
    </span>
  )
}

export function HangFrom({ children, finish, className, cue }: Props & { children: ReactNode }) {
  return (
    <span className={styles.letter}>
      {children}
      <HangingLogo finish={finish} cue={cue} className={`${styles.fromLetter} ${className ?? ''}`} />
    </span>
  )
}
