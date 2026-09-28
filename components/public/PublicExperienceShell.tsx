'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/components/public/Nav'
import PublicPageStage from '@/components/public/PublicPageStage'
import PlayerProvider from '@/components/public/player/PlayerProvider'

const EXPERIENCE_ROUTES = new Set(['/', '/events', '/lab', '/portfolio', '/meet', '/book'])

export default function PublicExperienceShell({ children, footer, sticky }: { children: React.ReactNode; footer: React.ReactNode; sticky: React.ReactNode }) {
  const pathname = usePathname()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)
  const [showSidewaysCue, setShowSidewaysCue] = useState(false)

  useEffect(() => {
    if (!experienceMode) return
    if (!window.matchMedia('(max-width: 1024px)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.sessionStorage.getItem('bae-sideways-cue-seen')) return

    const showTimer = window.setTimeout(() => {
      setShowSidewaysCue(true)
      window.sessionStorage.setItem('bae-sideways-cue-seen', '1')
    }, 350)
    const hideTimer = window.setTimeout(() => setShowSidewaysCue(false), 3600)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [experienceMode])


  return (
    <PlayerProvider>
      <div
        className={experienceMode ? 'public-experience-shell' : 'public-site-shell'}
      >
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Nav />
        {showSidewaysCue && experienceMode ? (
          <div className="public-sideways-cue" aria-hidden="true">
            <span>←</span>
            <i />
            <span>→</span>
          </div>
        ) : null}
        {!experienceMode ? sticky : null}
        <main
          id="main-content"
          tabIndex={-1}
          className={experienceMode ? 'public-experience-main' : undefined}
        >
          <PublicPageStage>{children}</PublicPageStage>
        </main>
        {!experienceMode ? footer : null}
      </div>
    </PlayerProvider>
  )
}
