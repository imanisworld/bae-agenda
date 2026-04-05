'use client'

/**
 * STICKY BOOKING CTA
 * Floating "Book DJ B.A.E." pill that appears after scrolling past the hero
 * and hides when the #booking section is in the viewport.
 *
 * Positioned bottom-left to avoid colliding with the ScrollFader (bottom-right).
 * Hidden on mobile below 1180px (where ScrollFader is also hidden) — instead
 * the mobile nav "Book" link covers this use case.
 */
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function StickyBookingCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const check = () => {
      const scrollY   = window.scrollY
      const threshold = window.innerHeight * 0.75

      // Hide if the #booking section is currently in the viewport
      const bookingEl = document.getElementById('booking')
      if (bookingEl) {
        const { top, bottom } = bookingEl.getBoundingClientRect()
        if (top < window.innerHeight && bottom > 0) {
          setVisible(false)
          return
        }
      }

      setVisible(scrollY > threshold)
    }

    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [])

  return (
    <div
      aria-hidden={!visible}
      style={{
        position:     'fixed',
        bottom:       'calc(32px + var(--safe-bottom, 0px))',
        left:         'clamp(16px, 2vw, 28px)',
        zIndex:       9,
        opacity:      visible ? 1 : 0,
        transform:    visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.97)',
        transition:   'opacity 220ms ease, transform 220ms ease',
        pointerEvents: visible ? 'auto' : 'none',
        /* Hidden on mobile — nav Book link covers it there */
        display:      'none',
      }}
      className="sticky-booking-cta"
    >
      <Link
        href="/book"
        tabIndex={visible ? 0 : -1}
        aria-label="Book DJ B.A.E."
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            '8px',
          padding:        '11px 20px',
          background:     'var(--violet)',
          color:          'var(--white)',
          fontFamily:     'DM Sans, sans-serif',
          fontSize:       '11px',
          fontWeight:     600,
          letterSpacing:  '0.18em',
          textTransform:  'uppercase',
          textDecoration: 'none',
          borderRadius:   '100px',
          whiteSpace:     'nowrap',
          boxShadow:
            '0 0 0 1px rgba(155,93,229,0.55), 0 6px 24px rgba(155,93,229,0.40), 0 2px 8px rgba(0,0,0,0.45)',
        }}
      >
        Book DJ B.A.E.
      </Link>
    </div>
  )
}
