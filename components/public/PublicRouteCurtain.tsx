'use client'

/**
 * Branded public-route curtain, adapted from the CoMinVi page-transition
 * reference (a staggered cover / reveal, not a copy of its code or assets).
 *
 * Navigation starts immediately. We never preventDefault, postpone router
 * changes or intercept form submits; an unfinished navigation cannot trap the
 * visitor behind an overlay. Touch page-swipes retain their existing slide
 * transition to avoid two animations fighting each other.
 */
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import styles from './PublicRouteCurtain.module.css'

const TITLES: Record<string, string> = {
  '/': 'Home',
  '/events': 'Events',
  '/lab': 'The Lab',
  '/portfolio': 'Past Work',
  '/meet': 'Meet',
  '/book': 'Book',
}
const ROUTES = new Set(Object.keys(TITLES))
const STORAGE_KEY = 'bae-page-curtain-next'
const COVER_MS = 255
const REVEAL_MS = 460
const NAV_FAILSAFE_MS = 1600
const ARRIVAL_TTL_MS = 5000

type Phase = 'idle' | 'cover' | 'reveal'
type CurtainState = { phase: Phase; label: string }
type Intent = { path: string; at: number }

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function PublicRouteCurtain({ swipePhase }: { swipePhase: string }) {
  const pathname = usePathname()
  const previousPath = useRef(pathname)
  const intentRef = useRef<Intent | null>(null)
  const timers = useRef<number[]>([])
  const swipePhaseRef = useRef(swipePhase)
  const [state, setState] = useState<CurtainState>({ phase: 'idle', label: '' })

  useEffect(() => { swipePhaseRef.current = swipePhase }, [swipePhase])

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((id) => window.clearTimeout(id))
      timers.current = []
    }
    const schedule = (fn: () => void, delay: number) => {
      timers.current.push(window.setTimeout(fn, delay))
    }

    // A native Book CTA reloads the document. Pick up its arrival on the new
    // document, but only once and never after an unrelated refresh.
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        window.sessionStorage.removeItem(STORAGE_KEY)
        const next = JSON.parse(stored) as Intent
        if (next.path === pathname && Date.now() - next.at < ARRIVAL_TTL_MS && !reduceMotion()) {
          setState({ phase: 'reveal', label: TITLES[pathname] ?? '' })
          schedule(() => setState({ phase: 'idle', label: '' }), REVEAL_MS)
        }
      }
    } catch {
      // Storage unavailable: all route links still work normally.
    }

    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.altKey || event.shiftKey ||
        reduceMotion()
      ) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return

      let url: URL
      try {
        url = new URL(anchor.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin || !ROUTES.has(url.pathname)) return
      if (url.pathname === window.location.pathname) return
      if (!ROUTES.has(window.location.pathname)) return

      const intent = { path: url.pathname, at: Date.now() }
      intentRef.current = intent
      clear()
      setState({ phase: 'cover', label: TITLES[url.pathname] })
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent))
      } catch {
        // Session storage is optional; never delay navigation.
      }

      // If a link fails, clear the curtain rather than hiding the page.
      schedule(() => {
        if (intentRef.current === intent) {
          intentRef.current = null
          setState({ phase: 'reveal', label: TITLES[url.pathname] })
          schedule(() => setState({ phase: 'idle', label: '' }), REVEAL_MS)
        }
      }, NAV_FAILSAFE_MS)
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clear()
    }
  // Attach delegated click handling once; pathname changes are handled below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (pathname === previousPath.current) return
    previousPath.current = pathname

    // Existing touch-swipe already provides a live page slide. Avoid adding a
    // curtain over that motion; dock links and browser navigations use curtain.
    if (reduceMotion() || swipePhaseRef.current === 'leaving' || swipePhaseRef.current === 'arriving') {
      intentRef.current = null
      setState({ phase: 'idle', label: '' })
      return
    }

    const intent = intentRef.current
    intentRef.current = null
    try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* optional */ }
    const hold = intent?.path === pathname ? Math.max(0, COVER_MS - (Date.now() - intent.at)) : 0

    const reveal = () => {
      setState({ phase: 'reveal', label: TITLES[pathname] ?? '' })
      const idle = window.setTimeout(() => setState({ phase: 'idle', label: '' }), REVEAL_MS)
      timers.current.push(idle)
    }
    const timer = window.setTimeout(reveal, hold)
    timers.current.push(timer)
    return () => {
      window.clearTimeout(timer)
    }
  }, [pathname])

  if (!ROUTES.has(pathname) || state.phase === 'idle') return null

  return (
    <div
      aria-hidden="true"
      className={`${styles.curtain} ${state.phase === 'cover' ? styles.cover : styles.reveal}`}
      data-page-transition={state.phase}
    >
      <span className={styles.panel} />
      <span className={styles.panel} />
      <span className={styles.panel} />
      <div className={styles.label}>
        <span className={styles.kicker}>DJ B.A.E.</span>
        <strong>{state.label}</strong>
        <span className={styles.rule} />
      </div>
    </div>
  )
}
