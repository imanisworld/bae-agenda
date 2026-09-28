'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PUBLIC_NAV } from '@/lib/constants'
import styles from './Nav.module.css'

const GLYPHS: Record<string, string> = {
  Home: 'BAE',
  Events: 'EV',
  Lab: 'LAB',
  Portfolio: 'WK',
  Meet: 'ME',
  Book: 'BK',
}

const TONES = ['burgundy', 'gold', 'ink', 'copper', 'champagne', 'oxblood'] as const

const NAV_CUE_SESSION_KEY = 'bae-nav-cue-dismissed'

export default function Nav() {
  const pathname = usePathname()
  const [showDockCue, setShowDockCue] = useState(false)

  useEffect(() => {
    setShowDockCue(sessionStorage.getItem(NAV_CUE_SESSION_KEY) !== '1')
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
        <Link href="/" className={styles.brand} aria-label="DJ B.A.E. — Home">
          DJ <span>B.A.E.</span>
        </Link>
        <span className={styles.route}>{routeLabel}</span>
        <span className={styles.status}>Indianapolis</span>
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
                <span className={styles.glyph} aria-hidden="true">{GLYPHS[item.label] ?? item.label.slice(0, 2)}</span>
                <span className={styles.tip} aria-hidden="true">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
