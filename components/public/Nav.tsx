'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { PUBLIC_LEGAL_NAV, PUBLIC_NAV, PUBLIC_SECONDARY_NAV } from '@/lib/constants'
import NowPlayingPill from '@/components/public/player/NowPlayingPill'
import styles from './Nav.module.css'

// Short, readable dock labels — full names still go to aria-label and the hover tip.
const DOCK_LABELS: Record<string, string> = {
  Portfolio: 'Work',
}

const TONES = ['burgundy', 'gold', 'ink', 'copper', 'champagne', 'oxblood'] as const
const NAV_CUE_SESSION_KEY = 'bae-nav-cue-dismissed'

const MORE_LINKS = [...PUBLIC_SECONDARY_NAV, ...PUBLIC_LEGAL_NAV]

function pathOf(href: string) {
  return href.split('#')[0]
}

function sectionActive(pathname: string, href: string) {
  if (href.includes('#')) return false
  const path = pathOf(href)
  if (path === '/portal/login') return pathname.startsWith('/portal')
  return pathname === path || pathname.startsWith(`${path}/`)
}

export default function Nav() {
  const pathname = usePathname()
  const [showDockCue, setShowDockCue] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let hideTimer: number | undefined
    const frame = requestAnimationFrame(() => {
      const shouldShow = sessionStorage.getItem(NAV_CUE_SESSION_KEY) !== '1'
      setShowDockCue(shouldShow)

      if (shouldShow) {
        hideTimer = window.setTimeout(() => {
          setShowDockCue(false)
          sessionStorage.setItem(NAV_CUE_SESSION_KEY, '1')
        }, 2200)
      }
    })

    return () => {
      cancelAnimationFrame(frame)
      if (hideTimer) window.clearTimeout(hideTimer)
    }
  }, [])

  function dismissDockCue() {
    setShowDockCue(false)
    sessionStorage.setItem(NAV_CUE_SESSION_KEY, '1')
  }

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return

    function onPointerDown(event: PointerEvent) {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMoreOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [moreOpen])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  const moreActive = MORE_LINKS.some((item) => sectionActive(pathname, item.href))

  const routeLabel =
    PUBLIC_NAV.find((item) => isActive(item.href))?.label ??
    MORE_LINKS.find((item) => sectionActive(pathname, item.href))?.label ??
    'DJ B.A.E.'

  return (
    <div className={styles.chrome}>
      <div className={styles.topbar}>
        {/* The logo now hangs from each page's own art (see brand/HangingLogo). */}
        <div className={styles.more} ref={moreRef}>
          <button
            type="button"
            className={`${styles.moreButton}${moreActive ? ` ${styles.moreButtonActive}` : ''}`}
            aria-expanded={moreOpen}
            aria-controls={moreOpen ? 'site-more-menu' : undefined}
            onClick={() => setMoreOpen((open) => !open)}
          >
            More
          </button>
          {moreOpen ? (
            <div id="site-more-menu" className={styles.moreMenu} role="menu">
              {MORE_LINKS.map((item) => {
                const active = sectionActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={`${styles.moreLink}${active ? ` ${styles.moreLinkActive}` : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
        <span aria-hidden="true" />
        <NowPlayingPill fallback={<span className={styles.route}>{routeLabel}</span>} />
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
                prefetch
                aria-current={active ? 'page' : undefined}
                aria-label={DOCK_LABELS[item.label] ? `${DOCK_LABELS[item.label]} (${item.label})` : item.label}
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
