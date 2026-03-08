'use client'

import { useEffect, useRef } from 'react'

/**
 * CUSTOM CURSOR — Client Component
 * Futuristic dual-ring cursor: small violet dot + lagged outer ring.
 * Hides system cursor on desktop; ring scales + turns violet on interactive elements.
 * Respects prefers-reduced-motion and touch-primary devices.
 */
export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(hover: none)').matches) return

    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    document.body.classList.add('has-custom-cursor')

    let mouseX = 0, mouseY = 0
    let ringX  = 0, ringY  = 0
    let rafId  = 0
    let visible = false

    const show = () => {
      if (visible) return
      visible = true
      dot.style.opacity  = '1'
      ring.style.opacity = '1'
    }

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      show()
    }

    const onEnter = () => {
      ring.style.transform   = 'translate(-50%, -50%) scale(1.7)'
      ring.style.borderColor = 'var(--violet)'
      dot.style.transform    = 'translate(-50%, -50%) scale(0.5)'
    }

    const onLeave = () => {
      ring.style.transform   = 'translate(-50%, -50%) scale(1)'
      ring.style.borderColor = 'rgba(245,245,240,0.35)'
      dot.style.transform    = 'translate(-50%, -50%) scale(1)'
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.1
      ringY += (mouseY - ringY) * 0.1
      dot.style.left  = `${mouseX}px`
      dot.style.top   = `${mouseY}px`
      ring.style.left = `${ringX}px`
      ring.style.top  = `${ringY}px`
      rafId = requestAnimationFrame(animate)
    }

    const selectors = 'a, button, [role="button"], input, .card-hover, .social-card, .tech-card'
    const els = document.querySelectorAll(selectors)
    els.forEach(el => {
      el.addEventListener('mouseenter', onEnter as EventListener)
      el.addEventListener('mouseleave', onLeave as EventListener)
    })

    window.addEventListener('mousemove', onMove)
    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      document.body.classList.remove('has-custom-cursor')
      document.querySelectorAll(selectors).forEach(el => {
        el.removeEventListener('mouseenter', onEnter as EventListener)
        el.removeEventListener('mouseleave', onLeave as EventListener)
      })
    }
  }, [])

  return (
    <>
      {/* Inner dot — snaps to cursor position */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0, top: 0,
          width: '5px', height: '5px',
          background: 'var(--violet)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          pointerEvents: 'none',
          zIndex: 10000,
          opacity: 0,
          willChange: 'left, top',
          transition: 'transform 200ms ease',
        }}
      />
      {/* Outer ring — lags behind for depth */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0, top: 0,
          width: '28px', height: '28px',
          border: '1px solid rgba(245,245,240,0.35)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          pointerEvents: 'none',
          zIndex: 10000,
          opacity: 0,
          willChange: 'left, top',
          transition: 'border-color 200ms ease, transform 200ms ease',
        }}
      />
    </>
  )
}
