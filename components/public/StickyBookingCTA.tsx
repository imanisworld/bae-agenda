'use client'

/**
 * STICKY BOOKING CTA
 * Appears after the visitor moves past most of the hero and hides while the
 * homepage booking section is visible. Kept available on mobile so booking
 * never requires reopening the navigation drawer.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function StickyBookingCTA() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [trackedPathname, setTrackedPathname] = useState(pathname)

  const suppress =
    pathname === '/book' ||
    pathname === '/built' ||
    pathname.startsWith('/pay') ||
    pathname.startsWith('/portal')

  if (trackedPathname !== pathname) {
    setTrackedPathname(pathname)
    setVisible(false)
  }

  useEffect(() => {
    if (suppress) return

    const check = () => {
      const threshold = window.innerHeight * 0.72

      const bookingEl = document.getElementById('booking')
      if (bookingEl) {
        const { top, bottom } = bookingEl.getBoundingClientRect()
        if (top < window.innerHeight && bottom > 0) {
          setVisible(false)
          return
        }
      }

      setVisible(window.scrollY > threshold)
    }

    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    const frame = window.requestAnimationFrame(check)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [pathname, suppress])

  if (suppress) return null

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: 'fixed',
        bottom: 'calc(18px + var(--safe-bottom, 0px))',
        left: '50%',
        zIndex: 90,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(-50%) translateY(0) scale(1)'
          : 'translateX(-50%) translateY(10px) scale(0.97)',
        transition: 'opacity 220ms ease, transform 220ms ease',
        pointerEvents: visible ? 'auto' : 'none',
        width: 'max-content',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <Link
        href="/book"
        tabIndex={visible ? 0 : -1}
        aria-label="Book DJ B.A.E."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '46px',
          padding: '11px 20px',
          background: 'var(--violet)',
          color: 'var(--white)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          borderRadius: '100px',
          whiteSpace: 'nowrap',
          boxShadow:
            '0 0 0 1px rgba(155,93,229,0.55), 0 6px 24px rgba(155,93,229,0.34), 0 2px 8px rgba(0,0,0,0.45)',
        }}
      >
        Book DJ B.A.E. →
      </Link>
    </div>
  )
}
