'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import styles from './page.module.css'

type IdentityCopy = {
  kicker: string
  lines: readonly [string, string]
  detail: string
}

const directionIdentity: IdentityCopy = {
  kicker: 'Identity in motion',
  lines: ['Objects can move.', "The site doesn't have to."],
  detail: 'One or two dimensional brand moments can carry the personality while the rest stays clean and grown.',
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function EditorialStage({ priority = false, controls = true }: { priority?: boolean; controls?: boolean }) {
  const [shift, setShift] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef({ x: 0, shift: 0 })

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOrigin.current = { x: event.clientX, shift }
    setDragging(true)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const next = dragOrigin.current.shift + (event.clientX - dragOrigin.current.x) * 0.45
    setShift(clamp(Math.round(next), -72, 96))
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(false)
  }

  return (
    <div className={styles.editorialStage}>
      <div className={styles.editorialWord} aria-hidden="true">BAE</div>
      <div
        className={styles.editorialPhoto}
        data-dragging={dragging}
        style={{ '--shift': `${shift}px` } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Image
          src="/photos/images/outside.jpg"
          alt="DJ B.A.E. performing"
          fill
          sizes="(max-width: 800px) 90vw, 46vw"
          priority={priority}
          draggable={false}
        />
      </div>
      <div className={styles.editorialCopy}>
        <p>SELECTOR · GENRE BENDER</p>
        <h2>Sound<br />Architect</h2>
        <span>Indianapolis · Open format</span>
      </div>
      {controls ? (
        <>
          <div className={styles.editorialStamp}>LIVE<br />ENERGY</div>
          <div className={`${styles.shiftRow} ${styles.editorialTools}`}>
            <button type="button" className={styles.shiftButton} onClick={() => setShift((value) => clamp(value - 16, -72, 96))}>
              Shift left
            </button>
            <button type="button" className={styles.shiftButton} onClick={() => setShift((value) => clamp(value + 16, -72, 96))}>
              Shift right
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function DimensionalStage({
  copy = directionIdentity,
  controls = true,
  phone,
  children,
}: {
  copy?: IdentityCopy
  controls?: boolean
  phone?: boolean
  children?: ReactNode
}) {
  const reduced = usePrefersReducedMotion()
  const showPhone = phone ?? controls
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function tiltFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8
    setTilt({ x: clamp(x, -7, 7), y: clamp(y, -5, 5) })
  }

  return (
    <div
      className={styles.dimensionStage}
      style={{
        '--tilt-x': `${tilt.x}deg`,
        '--tilt-y': `${tilt.y}deg`,
        '--pan-x': `${tilt.x * 1.4}px`,
        '--pan-y': `${tilt.y * 1.4}px`,
      } as CSSProperties}
      onPointerMove={(event) => {
        if (controls && event.pointerType !== 'mouse') return
        tiltFromPointer(event)
      }}
      onPointerLeave={() => {
        if (!controls) setTilt({ x: 0, y: 0 })
      }}
      onPointerCancel={() => {
        if (!controls) setTilt({ x: 0, y: 0 })
      }}
    >
      <div className={styles.glow} />
      <div className={styles.logoObject}>
        <Image src="/photos/images/logo.JPG" alt="DJ B.A.E. portrait" fill sizes="34vw" />
      </div>
      {reduced || !showPhone ? null : (
        <div className={styles.phoneObject}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/images/phone%203d%20.gif" alt="Animated phone" />
        </div>
      )}
      <div className={styles.dimensionCopy}>
        <p>{copy.kicker}</p>
        <h2>{copy.lines[0]}<br />{copy.lines[1]}</h2>
        <span>{copy.detail}</span>
        {children}
        {controls ? (
          <div className={styles.shiftRow}>
            <button type="button" className={styles.shiftButton} onClick={() => setTilt({ x: -6, y: 0 })}>Turn left</button>
            <button type="button" className={styles.shiftButton} onClick={() => setTilt({ x: 0, y: 0 })}>Center</button>
            <button type="button" className={styles.shiftButton} onClick={() => setTilt({ x: 6, y: 0 })}>Turn right</button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
