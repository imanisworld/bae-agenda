'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PUBLIC_NAV } from '@/lib/constants'
import NowPlayingPill from '@/components/public/player/NowPlayingPill'
import styles from './Nav.module.css'

// Short, readable dock labels — full names still go to aria-label and the hover tip.
const DOCK_LABELS: Record<string, string> = {
  Portfolio: 'Work',
}

const TONES = ['burgundy', 'gold', 'ink', 'copper', 'champagne', 'oxblood'] as const
const NAV_CUE_SESSION_KEY = 'bae-nav-cue-dismissed'

export default function Nav() {
  const pathname = usePathname()
  const [showDockCue, setShowDockCue] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setShowDockCue(sessionStorage.getItem(NAV_CUE_SESSION_KEY) !== '1')
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  function dismissDockCue() {
    setShowDockCue(false)
    sessionStorage.setItem(NAV_CUE_SESSION_KEY, '1')
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  const routeLabel =
    PUBLIC_NAV.find((item) => isActive(item.href))?.label ??
    (pathname.startsWith('/press-kit') ? 'Press Kit' : 'DJ B.A.E.')

  return (
    <div className={styles.chrome}>
      <div className={styles.topbar}>
        {/* The logo now hangs from each page's own art (see brand/HangingLogo). */}
        <span aria-hidden="true" />
        <span className={styles.route}>{routeLabel}</span>
        <NowPlayingPill fallback={<span className={styles.status}>Indianapolis</span>} />
      </div>

      <div className={styles.dockWrap}>
        {showDockCue ? (
          <div className={styles.dockCue} aria-hidden="true">
            <span className={styles.cueDesktop}>Click a section</span>
            <span className={styles.cueMobile}>Tap a section</span>
            <span className={styles.cueArrow}>↓</span>
          </div>
        ) : null}
        <nav className={styles.dock} aria-label="Primary navigation">
          {PUBLIC_NAV.map((item, index) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`${styles.item} ${active ? styles.active : ''}`}
                data-tone={TONES[index % TONES.length]}
                onClick={dismissDockCue}
              >
                <span className={styles.glyph} aria-hidden="true">{DOCK_LABELS[item.label] ?? item.label}</span>
                {DOCK_LABELS[item.label] && (
                  <span className={styles.tip} aria-hidden="true">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
