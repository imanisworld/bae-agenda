'use client'

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Nav from '@/components/public/Nav'
import PublicPageStage from '@/components/public/PublicPageStage'
import PlayerProvider from '@/components/public/player/PlayerProvider'

const EXPERIENCE_ROUTES = new Set(['/', '/events', '/lab', '/portfolio', '/meet', '/book'])
const EXIT_DELAY_MS = 120

export default function PublicExperienceShell({ children, footer, sticky }: { children: React.ReactNode; footer: React.ReactNode; sticky: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)
  const [leaving, setLeaving] = useState(false)
  const navigationTimer = useRef<number | null>(null)

  useEffect(() => {
    setLeaving(false)

    return () => {
      if (navigationTimer.current !== null) {
        window.clearTimeout(navigationTimer.current)
        navigationTimer.current = null
      }
    }
  }, [pathname])

  function handleRouteClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      leaving
    ) {
      return
    }

    const target = event.target
    if (!(target instanceof Element)) return

    const anchor = target.closest<HTMLAnchorElement>('a[href]')
    if (!anchor || anchor.hasAttribute('download')) return
    if (anchor.target && anchor.target !== '_self') return

    const url = new URL(anchor.href, window.location.href)
    if (url.origin !== window.location.origin) return
    if (url.pathname === pathname && url.search === window.location.search) return
    if (!EXPERIENCE_ROUTES.has(pathname) || !EXPERIENCE_ROUTES.has(url.pathname)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    event.preventDefault()
    router.prefetch(url.pathname)
    setLeaving(true)

    navigationTimer.current = window.setTimeout(() => {
      router.push(`${url.pathname}${url.search}${url.hash}`)
    }, EXIT_DELAY_MS)
  }

  return (
    <PlayerProvider>
      <div
        className={
          experienceMode
            ? `public-experience-shell${leaving ? ' public-experience-shell--leaving' : ''}`
            : 'public-site-shell'
        }
        onClickCapture={handleRouteClick}
      >
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Nav />
        {!experienceMode ? sticky : null}
        <main
          id="main-content"
          tabIndex={-1}
          className={experienceMode ? 'public-experience-main' : undefined}
          aria-busy={leaving || undefined}
        >
          <PublicPageStage>{children}</PublicPageStage>
        </main>
        {!experienceMode ? footer : null}
      </div>
    </PlayerProvider>
  )
}
