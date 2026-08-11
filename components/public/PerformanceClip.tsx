'use client'

/**
 * PERFORMANCE CLIP
 * A short, silent, looping live-set clip used in place of a static photo
 * in the photo strip — motion reads as "real event energy" better than
 * another still frame. No audio track exists on the source file, so there
 * is nothing to mute; playback is paused (falls back to the first frame)
 * for anyone who prefers reduced motion.
 */
import { useEffect, useRef, useState } from 'react'

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

interface Props {
  src: string
  ariaLabel: string
}

export default function PerformanceClip({ src, ariaLabel }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (prefersReducedMotion) {
      video.pause()
      video.currentTime = 0
      return
    }

    // Chrome pauses (and won't resume) video-only autoplay that starts
    // offscreen as a power-saving measure — only play while visible, which
    // also means we're not decoding frames nobody can see.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {
            // Autoplay can still be blocked by the browser — the first
            // frame is a reasonable static fallback.
          })
        } else {
          video.pause()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  return (
    <video
      ref={videoRef}
      src={src}
      aria-label={ariaLabel}
      muted
      loop
      playsInline
      preload="metadata"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  )
}
