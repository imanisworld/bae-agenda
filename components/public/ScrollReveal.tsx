'use client'

/**
 * SCROLL REVEAL — Client Component
 * Wraps children in a div that fades up when it enters the viewport.
 * Applies the .reveal / .is-visible CSS classes from globals.css.
 * Respects prefers-reduced-motion via CSS — no JS check needed.
 */
import { useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: 0 | 1 | 2 | 3 | 4
  as?: keyof React.JSX.IntrinsicElements
}

export default function ScrollReveal({ children, className = '', delay = 0, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const delayClass = delay > 0 ? ` reveal-delay-${delay}` : ''

  return (
    // @ts-expect-error — dynamic tag with ref is safe here
    <Tag ref={ref} className={`reveal${delayClass}${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  )
}
