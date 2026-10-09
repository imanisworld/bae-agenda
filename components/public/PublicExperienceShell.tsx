'use client'

import { useRef, type CSSProperties } from 'react'
import { usePathname } from 'next/navigation'
import Nav from '@/components/public/Nav'
import PublicPageStage from '@/components/public/PublicPageStage'
import PublicRouteCurtain from '@/components/public/PublicRouteCurtain'
import PlayerProvider from '@/components/public/player/PlayerProvider'
import { ROUTE_ORDER, useRouteGestures } from '@/components/public/useRouteGestures'

const EXPERIENCE_ROUTES = new Set<string>(ROUTE_ORDER)

export default function PublicExperienceShell({ children, footer, sticky }: { children: React.ReactNode; footer: React.ReactNode; sticky: React.ReactNode }) {
  const pathname = usePathname()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)
  const shellRef = useRef<HTMLDivElement>(null)
  const { phase, direction, refresh } = useRouteGestures(shellRef, pathname, experienceMode)
  const pulling = refresh.pull > 0 || refresh.refreshing

  return (
    <PlayerProvider>
      <div
        ref={shellRef}
        className={
          experienceMode
            ? `public-experience-shell${phase !== 'idle' ? ` public-experience-shell--${phase}` : ''}`
            : 'public-site-shell'
        }
        data-route-direction={direction ?? undefined}
      >
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Nav />
        {experienceMode ? (
          <div
            className={`route-refresh${pulling ? ' route-refresh--active' : ''}${refresh.ready ? ' route-refresh--ready' : ''}`}
            style={{ '--refresh-pull': `${refresh.pull}px` } as CSSProperties}
            role="status"
          >
            {pulling ? (
              <>
                <span className="route-refresh-icon" aria-hidden="true" style={{ rotate: `${refresh.pull * 3}deg` }}>↻</span>
                {refresh.refreshing ? 'Refreshing' : refresh.ready ? 'Release to refresh' : 'Pull to refresh'}
              </>
            ) : null}
          </div>
        ) : null}
        {!experienceMode ? sticky : null}
        <main
          id="main-content"
          tabIndex={-1}
          className={experienceMode ? 'public-experience-main' : undefined}
          aria-busy={phase === 'leaving' || undefined}
        >
          <PublicPageStage>{children}</PublicPageStage>
        </main>
        {!experienceMode ? footer : null}
        {experienceMode ? <PublicRouteCurtain swipePhase={phase} /> : null}
      </div>
    </PlayerProvider>
  )
}
