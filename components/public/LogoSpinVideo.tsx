'use client'

/**
 * Spinning DJ B.A.E. tag as a transparent video — far lighter to download and
 * decode than an animated image. Safari/iOS only render transparency from
 * HEVC (.mov) and everything else from VP9 (.webm); a browser given the wrong
 * one shows a black box, so we pick explicitly instead of relying on <source>
 * order. Reduced-motion and data-saver visitors get the still poster.
 */
import { useSyncExternalStore } from 'react'

type Choice = 'poster' | 'mov' | 'webm'

function detect(): Choice {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  if (reduceMotion || saveData) return 'poster'
  const ua = navigator.userAgent
  const webkitOnly = /iP(hone|ad|od)/.test(ua) || (/Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|FxiOS|Firefox/.test(ua))
  return webkitOnly ? 'mov' : 'webm'
}

const noop = () => () => {}

export default function LogoSpinVideo({ className }: { className?: string }) {
  // Server render and first paint use the poster; the client then swaps in a video.
  const choice = useSyncExternalStore<Choice>(noop, detect, () => 'poster')

  if (choice === 'poster') {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny static poster, served as-is
      <img className={className} src="/brand/dj-bae-logo-spin-poster.webp" alt="" width={448} height={343} decoding="async" />
    )
  }

  return (
    <video
      key={choice}
      className={className}
      src={choice === 'mov' ? '/brand/dj-bae-logo-spin.mov' : '/brand/dj-bae-logo-spin.webm'}
      poster="/brand/dj-bae-logo-spin-poster.webp"
      width={448}
      height={344}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
    />
  )
}
