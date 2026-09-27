'use client'

import { usePathname } from 'next/navigation'

const EXPERIENCE_ROUTES = new Set(['/', '/events', '/lab', '/portfolio', '/meet', '/book'])

export default function PublicPageStage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)

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
