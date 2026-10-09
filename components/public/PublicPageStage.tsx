'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { ROUTE_ORDER } from './useRouteGestures'

const EXPERIENCE_ROUTES = new Set<string>(ROUTE_ORDER)

// The route backdrops in globals.css. Warm only the adjacent routes rather than
// fetching all six photos after every page entry (including obsolete variants).
const PAGE_PHOTOS: Record<(typeof ROUTE_ORDER)[number], string> = {
  '/': '/photos/rooms/home-plexmix.webp',
  '/events': '/photos/rooms/tile-booth.webp',
  '/lab': '/photos/rooms/lab-orange-albums.webp',
  '/portfolio': '/photos/rooms/work-booth.webp',
  '/meet': '/photos/rooms/meet-got-music.webp',
  '/book': '/photos/rooms/book-warm-turntable.webp',
}

function usePreloadPagePhotos(pathname: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const routeIndex = ROUTE_ORDER.indexOf(pathname as (typeof ROUTE_ORDER)[number])
    if (routeIndex < 0) return

    const warm = () => {
      for (const route of [ROUTE_ORDER[routeIndex - 1], ROUTE_ORDER[routeIndex + 1]]) {
        if (route) new Image().src = PAGE_PHOTOS[route]
      }
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(warm, 2500)
    return () => clearTimeout(id)
  }, [pathname, enabled])
}

export default function PublicPageStage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)
  usePreloadPagePhotos(pathname, experienceMode)

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
