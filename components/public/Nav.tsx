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
import { PUBLIC_NAV } from '@/lib/constants'

export default function Nav() {
  const pathname = usePathname()
  const [scrolled,     setScrolled]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const forceSolidNav = pathname !== '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

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

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header
        role="banner"
        style={{
          position:    'fixed',
          top: 0, left: 0, right: 0,
          zIndex:      100,
          background:  scrolled || menuOpen || forceSolidNav
            ? 'rgba(8,8,8,0.95)'
            : 'linear-gradient(180deg, rgba(8,8,10,0.82) 0%, rgba(8,8,10,0.0) 100%)',
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
              <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
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
                <Link key={item.href} href={item.href} className="nav-book">
                  {item.label}
                </Link>
              ) : (
                <Link key={item.href} href={item.href} className="nav-link">
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
          top:        '68px',
          left:       0,
          right:      0,
          bottom:     0,
          zIndex:     99,
          background: 'rgba(8,8,8,0.98)',
          backdropFilter: 'blur(20px)',
          display:    'flex',
          flexDirection: 'column',
          overflowY:  'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          padding:    '40px 32px 48px',
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
              className="nav-drawer-book"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {item.label}
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="nav-drawer-link"
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
