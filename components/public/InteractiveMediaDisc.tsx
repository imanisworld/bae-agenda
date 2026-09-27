'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

const BASE_SPIN_DEG_PER_MS = 360 / 12000
const DRAG_RESISTANCE = 0.88

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
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches)
    onChange()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange)
      return () => mediaQuery.removeEventListener('change', onChange)
    }

    mediaQuery.addListener(onChange)
    return () => mediaQuery.removeListener(onChange)
  }, [])

  return prefersReducedMotion
}

interface InteractiveMediaDiscProps {
  label?: string
  videoSrc?: string
  imageSrc?: string
  className?: string
}

export default function InteractiveMediaDisc({
  label = 'B.A.E.',
  videoSrc,
  imageSrc,
  className = '',
}: InteractiveMediaDiscProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const prefersReducedMotion = usePrefersReducedMotion()

  const discRef = useRef<HTMLSpanElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
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
    const disc = discRef.current
    if (!disc) return

    disc.style.setProperty('--interactive-disc-rotation', `${angleRef.current}deg`)
    disc.style.setProperty('--interactive-disc-sheen-shift', `${clamp(dragVelocity * 1.1, -14, 14)}deg`)
  }, [])

  useEffect(() => {
    const node = buttonRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(Boolean(entry?.isIntersecting))
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const tick = (ts: number) => {
      const lastTs = lastTsRef.current ?? ts
      const dt = Math.min(34, ts - lastTs)
      lastTsRef.current = ts

      if (!isDragging) {
        const shouldAutoSpin = isVisible && isPlaying && !prefersReducedMotion
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
  }, [applyVisuals, isDragging, isPlaying, isVisible, prefersReducedMotion])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isVisible && isPlaying && !prefersReducedMotion) {
      void video.play().catch(() => {})
      return
    }

    video.pause()
  }, [isPlaying, isVisible, prefersReducedMotion])

  const pointerAngle = (event: PointerEvent<HTMLSpanElement>) => {
    const disc = discRef.current
    if (!disc) return 0
    const rect = disc.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI
  }

  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    event.preventDefault()
    pointerIdRef.current = event.pointerId
    dragDistanceRef.current = 0
    setIsDragging(true)

    lastPointerAngleRef.current = pointerAngle(event)
    lastPointerTsRef.current = event.timeStamp
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (!isDragging || pointerIdRef.current !== event.pointerId) return
    event.preventDefault()

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
      resumeBoostRef.current = clamp(Math.abs(velocityRef.current) * 0.45, 0, 0.05)
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`interactive-disc-button ${className} ${isPlaying ? 'is-playing' : 'is-paused'} ${isDragging ? 'is-dragging' : ''}`.trim()}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? 'Pause disc motion' : 'Resume disc motion'}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false
          return
        }
        setIsPlaying((value) => !value)
      }}
    >
      <span className="interactive-disc-wrap" aria-hidden="true">
        <span className="interactive-disc-glow" />
        <span className="interactive-disc-pulse" />
        <span
          ref={discRef}
          className="interactive-disc"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <span className="interactive-disc-grooves" />
          <span className="interactive-disc-sheen" />
          <span className="interactive-disc-ring interactive-disc-ring-outer" />
          <span className="interactive-disc-ring interactive-disc-ring-inner" />
          <span className={`interactive-disc-center ${videoSrc ? 'has-video' : ''}`}>
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="interactive-disc-center-video"
              />
            ) : imageSrc ? (
              <Image src={imageSrc} alt="" fill sizes="160px" quality={90} className="interactive-disc-center-image" />
            ) : (
              <span className="interactive-disc-center-label">{label}</span>
            )}
          </span>
          <span className="interactive-disc-core" />
          <span className="interactive-disc-marker" />
        </span>
      </span>
    </button>
  )
}
