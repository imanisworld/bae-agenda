'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

const BASE_SPIN_DEG_PER_MS = 360 / 2800
const DRAG_RESISTANCE = 0.82

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function shortestAngleDelta(next: number, prev: number) {
  let delta = next - prev
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches)
    onChange()
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return prefersReducedMotion
}

export default function HeroDeck() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const prefersReducedMotion = usePrefersReducedMotion()

  const recordRef = useRef<HTMLSpanElement | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const dragDistanceRef = useRef(0)
  const suppressClickRef = useRef(false)

  const angleRef = useRef(0)
  const velocityRef = useRef(BASE_SPIN_DEG_PER_MS)
  const resumeBoostRef = useRef(0)
  const lastTsRef = useRef<number | null>(null)
  const lastPointerAngleRef = useRef<number | null>(null)
  const lastPointerTsRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const applyVisuals = useCallback((dragVelocity = 0) => {
    const record = recordRef.current
    if (!record) return

    record.style.setProperty('--record-rotation', `${angleRef.current}deg`)
    record.style.setProperty('--drag-sheen-shift', `${clamp(dragVelocity * 0.9, -10, 10)}deg`)
    record.style.setProperty('--arm-drag-react', `${clamp(dragVelocity * 0.06, -1.2, 1.2)}deg`)
  }, [])

  useEffect(() => {
    const tick = (ts: number) => {
      const lastTs = lastTsRef.current ?? ts
      const dt = Math.min(34, ts - lastTs)
      lastTsRef.current = ts

      if (!isDragging) {
        const shouldAutoSpin = isPlaying && !prefersReducedMotion
        const targetVelocity = shouldAutoSpin
          ? BASE_SPIN_DEG_PER_MS + resumeBoostRef.current
          : 0

        velocityRef.current += (targetVelocity - velocityRef.current) * 0.12

        if (resumeBoostRef.current > 0.0001) {
          resumeBoostRef.current *= 0.9
        } else {
          resumeBoostRef.current = 0
        }

        if (Math.abs(velocityRef.current) > 0.0001) {
          angleRef.current += velocityRef.current * dt
          applyVisuals(velocityRef.current * 8)
        }
      }

      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [applyVisuals, isDragging, isPlaying, prefersReducedMotion])

  const pointerAngle = (event: PointerEvent<HTMLSpanElement>) => {
    const record = recordRef.current
    if (!record) return 0
    const rect = record.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI
  }

  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    pointerIdRef.current = event.pointerId
    dragDistanceRef.current = 0
    setIsDragging(true)

    lastPointerAngleRef.current = pointerAngle(event)
    lastPointerTsRef.current = event.timeStamp
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (!isDragging || pointerIdRef.current !== event.pointerId) return

    const currentAngle = pointerAngle(event)
    const lastPointerAngle = lastPointerAngleRef.current
    const lastPointerTs = lastPointerTsRef.current ?? event.timeStamp
    if (lastPointerAngle == null) return

    const delta = shortestAngleDelta(currentAngle, lastPointerAngle) * DRAG_RESISTANCE
    const dt = Math.max(8, event.timeStamp - lastPointerTs)
    dragDistanceRef.current += Math.abs(delta)

    angleRef.current += delta
    velocityRef.current = delta / dt

    applyVisuals(velocityRef.current * 24)

    lastPointerAngleRef.current = currentAngle
    lastPointerTsRef.current = event.timeStamp

    if (dragDistanceRef.current > 3) {
      suppressClickRef.current = true
    }
  }

  const finishDrag = () => {
    if (!isDragging) return
    setIsDragging(false)
    pointerIdRef.current = null
    lastPointerAngleRef.current = null
    lastPointerTsRef.current = null

    if (!prefersReducedMotion && isPlaying) {
      resumeBoostRef.current = clamp(Math.abs(velocityRef.current) * 0.35, 0, 0.08)
    }
  }

  return (
    <button
      type="button"
      className={`hero-deck ${isPlaying ? 'is-playing' : 'is-paused'} ${isDragging ? 'is-dragging' : ''}`}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? 'Pause turntable motion' : 'Resume turntable motion'}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false
          return
        }
        setIsPlaying((v) => !v)
      }}
    >
      <span className="hero-turntable" aria-hidden="true">
        <span className="hero-turntable-panel">
          <span className="hero-turntable-plinth" />

          <span className="hero-turntable-record-window">
            <span className="hero-turntable-record-shadow" />
            <span
              ref={recordRef}
              className="hero-turntable-record"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onPointerLeave={finishDrag}
              style={{ touchAction: 'none', userSelect: 'none' }}
            >
              <span className="hero-turntable-groove hero-turntable-groove-a" />
              <span className="hero-turntable-groove hero-turntable-groove-b" />
              <span className="hero-turntable-groove hero-turntable-groove-c" />
              <span className="hero-turntable-marble hero-turntable-marble-a" />
              <span className="hero-turntable-marble hero-turntable-marble-b" />
              <span className="hero-turntable-marble hero-turntable-marble-c" />
              <span className="hero-turntable-label">
                <span className="hero-turntable-label-ring" />
                <span className="hero-turntable-label-mark hero-turntable-label-mark-a" />
                <span className="hero-turntable-label-mark hero-turntable-label-mark-b" />
              </span>
              <span className="hero-turntable-spindle" />
              <span className="hero-turntable-shine" />
            </span>
          </span>

          <span className="hero-turntable-arm-base" />
          <span className="hero-turntable-arm">
            <span className="hero-turntable-arm-bar" />
            <span className="hero-turntable-arm-head" />
          </span>
        </span>
      </span>
    </button>
  )
}
