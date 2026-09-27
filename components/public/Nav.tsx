/**
 * PUBLIC NAV
 * Fixed top navigation for all public-facing pages.
 * Client component — needs scroll state + mobile menu state.
 *
 * Desktop: transparent at top → dark/blur after 60px scroll.
 * Mobile:  logo + hamburger; tapping opens a full-height slide-in drawer.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useBodyScrollLock } from '@/components/hooks/useBodyScrollLock'
import { PUBLIC_NAV } from '@/lib/constants'

export default function Nav() {
  const pathname = usePathname()
  const [scrolled,     setScrolled]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [standaloneTopOffset, setStandaloneTopOffset] = useState(0)
  const forceSolidNav = pathname !== '/'

  useBodyScrollLock(menuOpen)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(display-mode: standalone)')

    const syncStandaloneOffset = () => {
      const isStandalone = mediaQuery.matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
      setStandaloneTopOffset(isStandalone ? 10 : 0)
    }

    syncStandaloneOffset()
    window.addEventListener('orientationchange', syncStandaloneOffset)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncStandaloneOffset)
      return () => {
        mediaQuery.removeEventListener('change', syncStandaloneOffset)
        window.removeEventListener('orientationchange', syncStandaloneOffset)
      }
    }

    mediaQuery.addListener(syncStandaloneOffset)

    return () => {
      mediaQuery.removeListener(syncStandaloneOffset)
      window.removeEventListener('orientationchange', syncStandaloneOffset)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  // Active for exact matches and nested routes (/events/summer-set → Events).
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
  const navTopPadding = `calc(var(--safe-top) + ${standaloneTopOffset}px)`
  const drawerTop = `calc(var(--nav-height) + var(--safe-top) + ${standaloneTopOffset}px)`

  return (
    <>
      <header
        role="banner"
        style={{
          position:    'fixed',
          top: 0, left: 0, right: 0,
          zIndex:      100,
          paddingTop:  navTopPadding,
          background:  scrolled || menuOpen || forceSolidNav
            ? 'rgba(22,18,16,0.94)'
            : 'linear-gradient(180deg, rgba(14,11,10,0.88) 0%, rgba(14,11,10,0.0) 100%)',
          backdropFilter: scrolled || menuOpen || forceSolidNav ? 'blur(14px)' : 'blur(4px)',
          borderBottom: scrolled || menuOpen || forceSolidNav ? '1px solid var(--border)' : '1px solid transparent',
          transition: `background var(--motion-medium) var(--ease-standard),
                       border-color var(--motion-medium) var(--ease-standard)`,
        }}
      >
        <div
          style={{
            maxWidth:       '1280px',
            margin:         '0 auto',
            padding:        '0 clamp(20px, 5vw, 64px)',
            height:         '68px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
          }}
        >
          {/* ── Brand ───────────────────────────────── */}
          <Link
            href="/"
            aria-label="DJ B.A.E. — Home"
            onClick={closeMenu}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            <span
              style={{
                fontFamily:    'Conthrax, sans-serif',
                fontSize:      '13px',
                fontWeight:    600,
                letterSpacing: '0.18em',
                color:         'var(--white)',
              }}
            >
              DJ{' '}
              <span style={{ color: 'var(--gold)' }}>B.A.E.</span>
            </span>
          </Link>

          {/* ── Desktop nav ─────────────────────────── */}
          <nav
            aria-label="Main navigation"
            className="nav-desktop"
            style={{ alignItems: 'center', gap: '36px' }}
          >
            {PUBLIC_NAV.map((item) =>
              item.label === 'Book' ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-book"
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? 'nav-link nav-link-active' : 'nav-link'}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* ── Hamburger (mobile only) ──────────────── */}
          <button
            className="nav-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation-drawer"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background:    'none',
              border:        '1px solid transparent',
              cursor:        'pointer',
              padding:       '8px',
              minWidth:      '44px',
              minHeight:     '44px',
              flexDirection: 'column',
              gap:           '5px',
              alignItems:    'flex-end',
            }}
          >
            <span style={{
              display:         'block',
              width:           menuOpen ? '22px' : '22px',
              height:          '2px',
              background:      'var(--white)',
              transformOrigin: 'center',
              transform:       menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              transition:      'transform 0.22s ease',
            }} />
            <span style={{
              display:    'block',
              width:      '16px',
              height:     '2px',
              background: 'var(--white)',
              opacity:    menuOpen ? 0 : 1,
              transition: 'opacity 0.15s ease',
            }} />
            <span style={{
              display:         'block',
              width:           '22px',
              height:          '2px',
              background:      'var(--white)',
              transformOrigin: 'center',
              transform:       menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              transition:      'transform 0.22s ease',
            }} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ───────────────────────────── */}
      <nav
        id="mobile-navigation-drawer"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        style={{
          position:   'fixed',
          top:        drawerTop,
          left:       0,
          right:      0,
          bottom:     0,
          zIndex:     99,
          background: 'rgba(14,11,10,0.985)',
          backdropFilter: 'blur(20px)',
          display:    'flex',
          flexDirection: 'column',
          overflowY:  'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingTop: '32px',
          paddingRight: 'max(32px, calc(var(--safe-right) + 20px))',
          paddingBottom: 'calc(48px + var(--safe-bottom))',
          paddingLeft: 'max(32px, calc(var(--safe-left) + 20px))',
          gap:        '8px',
          transform:  menuOpen ? 'translateY(0)' : 'translateY(calc(-100% - 80px))',
          opacity:    menuOpen ? 1 : 0,
          visibility: menuOpen ? 'visible' : 'hidden',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, visibility 0.2s ease',
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        {PUBLIC_NAV.map((item, i) =>
          item.label === 'Book' ? (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={isActive(item.href) ? 'nav-drawer-book nav-drawer-active' : 'nav-drawer-book'}
              aria-current={isActive(item.href) ? 'page' : undefined}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {item.label}
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={isActive(item.href) ? 'nav-drawer-link nav-drawer-active' : 'nav-drawer-link'}
              aria-current={isActive(item.href) ? 'page' : undefined}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>
    </>
  )
}
