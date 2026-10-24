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
  '/meet': '/photos/rooms/meet-wood-shelves.webp',
  '/book': '/photos/rooms/contact-walnut-vinyl.webp',
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
      const id = window.requestIdleCallback(warm, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(warm, 900)
    return () => clearTimeout(id)
  }, [pathname, enabled])
}

export default function PublicPageStage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)
  usePreloadPagePhotos(pathname, experienceMode)

  useEffect(() => {
    // Text-only entrance: don't change markup, card motion, or controls.
    // An unenhanced page stays readable if JS is unavailable.
    const stage = document.querySelector<HTMLElement>('.public-page-stage-inner')
    if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const text = Array.from(
      stage.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, p, blockquote, .section-label')
    ).filter((element) => {
      if (element.closest('a, button, [role="button"], [aria-hidden="true"], [aria-live], [data-no-text-slide]')) {
        return false
      }
      // Preserve authored motion, opacity and positioning on specialty text.
      const style = getComputedStyle(element)
      return style.animationName === 'none' && style.opacity === '1' && style.translate === 'none'
    })

    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.textSlide = 'visible'
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    )

    for (const element of text) {
      element.dataset.textSlide = 'pending'
      observer.observe(element)
    }

    return () => {
      observer.disconnect()
      // Never leave readable content hidden after a route change.
      for (const element of text) {
        if (element.dataset.textSlide === 'pending') element.dataset.textSlide = 'visible'
      }
    }
  }, [pathname])

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
