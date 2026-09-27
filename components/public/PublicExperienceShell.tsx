'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/public/Nav'
import Footer from '@/components/public/Footer'
import PublicPageStage from '@/components/public/PublicPageStage'
import StickyBookingCTA from '@/components/public/StickyBookingCTA'

const EXPERIENCE_ROUTES = new Set(['/', '/events', '/lab', '/portfolio', '/meet', '/book'])

export default function PublicExperienceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)

  return (
    <div className={experienceMode ? 'public-experience-shell' : 'public-site-shell'}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      {!experienceMode ? <StickyBookingCTA /> : null}
      <main
        id="main-content"
        tabIndex={-1}
        className={experienceMode ? 'public-experience-main' : undefined}
      >
        <PublicPageStage>{children}</PublicPageStage>
      </main>
      {!experienceMode ? <Footer /> : null}
    </div>
  )
}
