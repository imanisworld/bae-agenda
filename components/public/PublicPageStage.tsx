'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const EXPERIENCE_ROUTES = new Set(['/', '/events', '/lab', '/portfolio', '/meet', '/book'])

// Each page's background photo (set per route in globals.css). Warmed once the
// first page is idle so the next page's photo is ready when you tap to it.
const PAGE_PHOTOS = [
  '/photos/rooms/home-plexmix.webp',
  '/photos/rooms/tile-booth.webp',
  '/photos/rooms/turntables-floor.webp',
  '/photos/rooms/work-booth.webp',
  '/photos/rooms/phones-box.webp',
  '/photos/rooms/phones-grid.webp',
]

function usePreloadPagePhotos(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const warm = () => PAGE_PHOTOS.forEach((src) => { new Image().src = src })
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(warm, 2500)
    return () => clearTimeout(id)
  }, [enabled])
}

export default function PublicPageStage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)
  usePreloadPagePhotos(experienceMode)

  return (
    <div
      className={experienceMode ? 'public-page-stage public-page-stage--experience' : 'public-page-stage'}
      data-experience-route={experienceMode ? pathname : undefined}
    >
      <div className="public-page-stage-glow" aria-hidden="true" />
      <div className="public-page-stage-scan" aria-hidden="true" />
      <div key={pathname} className="public-page-stage-inner">
        {children}
      </div>
    </div>
  )
}
