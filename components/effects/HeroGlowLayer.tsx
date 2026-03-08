'use client'

import { useEffect, useRef } from 'react'

/**
 * HERO GLOW LAYER — Client Component
 * Three ambient glow blobs: violet (parallax + float), gold (counter-parallax),
 * and a static center depth layer.
 * Respects prefers-reduced-motion: renders static glows with no movement.
 */
export default function HeroGlowLayer() {
  const violetRef = useRef<HTMLDivElement>(null)
  const goldRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch        = window.matchMedia('(hover: none)').matches
    if (prefersReduced || isTouch) return

    const violet = violetRef.current
    const gold   = goldRef.current
    if (!violet || !gold) return

    let targetX = 0, targetY = 0
    let currX   = 0, currY   = 0
    let rafId   = 0
    const t0 = Date.now()

    const onMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 2
      targetY = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const animate = () => {
      currX += (targetX - currX) * 0.04
      currY += (targetY - currY) * 0.04

      // Gentle floating oscillation on the violet blob
      const elapsed = (Date.now() - t0) / 1000
      const floatY  = Math.sin(elapsed * 0.35) * 18

      violet.style.transform = `translate(${currX * -22}px, ${currY * -22 + floatY}px)`
      gold.style.transform   = `translate(${currX * 28}px,  ${currY * 28}px)`

      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      {/* Violet glow — bottom right, parallax + float */}
      <div
        ref={violetRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '78vw', height: '78vw',
          background: 'radial-gradient(circle, rgba(155,93,229,0.20) 0%, transparent 62%)',
          bottom: '-20%', right: '-18%',
          pointerEvents: 'none', zIndex: 0,
          willChange: 'transform',
        }}
      />
      {/* Gold glow — top left, counter-parallax */}
      <div
        ref={goldRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '55vw', height: '55vw',
          background: 'radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 68%)',
          top: '-10%', left: '-15%',
          pointerEvents: 'none', zIndex: 0,
          willChange: 'transform',
        }}
      />
      {/* Center depth glow — static, always visible */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '65vw', height: '65vw',
          background: 'radial-gradient(circle, rgba(155,93,229,0.07) 0%, transparent 60%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />
    </>
  )
}
