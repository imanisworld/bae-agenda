'use client'

/**
 * Branded cover/reveal inspired by the CoMinVi page transition reference.
 *
 * Run one animation AFTER a route changes. The previous two-phase attempt
 * started an animation on click and restarted it when the route loaded,
 * producing half-drawn panels and mismatched labels on rapid taps.
 *
 * Navigation is never delayed or intercepted. The curtain is decorative,
 * ignores pointers, resets on each route change and auto-clears. The mobile
 * swipe gesture keeps its existing slide instead of layering two effects.
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
const NATIVE_INTENT_KEY = 'bae-page-curtain-next'
const INTENT_TTL_MS = 5000
const REVEAL_MS = 550

type Scene = { id: number; label: string }
type Intent = { path: string; at: number }

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function PublicRouteCurtain({ swipePhase }: { swipePhase: string }) {
  const pathname = usePathname()
  const previousPath = useRef(pathname)
  const mounted = useRef(false)
  const nextId = useRef(0)
  const clearTimer = useRef<number | null>(null)
  const [scene, setScene] = useState<Scene | null>(null)

  useEffect(() => {
    // A full document navigation unmounts the shell. Only remember the target,
    // then render its arrival curtain after the new document mounts.
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
      ) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return
      let url: URL
      try { url = new URL(anchor.href) } catch { return }
      if (
        url.origin !== window.location.origin ||
        !ROUTES.has(url.pathname) ||
        url.pathname === window.location.pathname
      ) return
      try {
        window.sessionStorage.setItem(
          NATIVE_INTENT_KEY,
          JSON.stringify({ path: url.pathname, at: Date.now() } satisfies Intent),
        )
      } catch { /* Optional storage must never block navigation. */ }
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      if (clearTimer.current !== null) window.clearTimeout(clearTimer.current)
    }
  }, [])

  useEffect(() => {
    const firstMount = !mounted.current
    mounted.current = true
    const changed = pathname !== previousPath.current
    previousPath.current = pathname

    let nativeArrival = false
    try {
      const stored = window.sessionStorage.getItem(NATIVE_INTENT_KEY)
      if (stored) {
        window.sessionStorage.removeItem(NATIVE_INTENT_KEY)
        const target = JSON.parse(stored) as Intent
        nativeArrival = firstMount &&
          target.path === pathname &&
          Date.now() - target.at >= 0 &&
          Date.now() - target.at < INTENT_TTL_MS
      }
    } catch { /* Ignore missing/invalid storage. */ }

    if (!changed && !nativeArrival) return
    if (clearTimer.current !== null) window.clearTimeout(clearTimer.current)

    if (!ROUTES.has(pathname) || reducedMotion() ||
        swipePhase === 'arriving' || swipePhase === 'leaving') {
      clearTimer.current = window.setTimeout(() => {
        setScene(null)
        clearTimer.current = null
      }, 0)
      return
    }

    // React state updates run asynchronously; rapid route changes cancel the
    // previous pending animation before it can flash old destination panels.
    const id = ++nextId.current
    clearTimer.current = window.setTimeout(() => {
      setScene({ id, label: TITLES[pathname] })
      clearTimer.current = window.setTimeout(() => {
        setScene((current) => current?.id === id ? null : current)
        clearTimer.current = null
      }, REVEAL_MS)
    }, 0)
  }, [pathname, swipePhase])

  if (!scene || !ROUTES.has(pathname)) return null

  return (
    <div key={scene.id} className={styles.curtain} aria-hidden="true" data-page-transition="reveal">
      <span className={styles.panel} />
      <span className={styles.panel} />
      <span className={styles.panel} />
      <div className={styles.label}>
        <span className={styles.kicker}>DJ B.A.E.</span>
        <strong>{scene.label}</strong>
        <span className={styles.rule} />
      </div>
    </div>
  )
}
