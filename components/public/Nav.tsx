/**
 * PUBLIC NAV
 * Fixed top navigation for all public-facing pages.
 * Client component — needs scroll state for transparent → opaque transition.
 *
 * Transparent at top of page; becomes dark + blurred after 60px of scroll.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PUBLIC_NAV } from '@/lib/constants'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(8,8,8,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: `background var(--motion-medium) var(--ease-standard),
                     border-color var(--motion-medium) var(--ease-standard),
                     backdrop-filter var(--motion-medium) var(--ease-standard)`,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 64px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* ── Brand ───────────────────────────────── */}
        <Link
          href="/"
          aria-label="DJ B.A.E. — Home"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          <span
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: 'var(--white)',
            }}
          >
            DJ{' '}
            <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
          </span>
        </Link>

        {/* ── Navigation ──────────────────────────── */}
        <nav
          aria-label="Main navigation"
          style={{ display: 'flex', alignItems: 'center', gap: '36px' }}
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
      </div>
    </header>
  )
}
