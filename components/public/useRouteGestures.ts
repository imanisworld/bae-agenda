'use client'

/**
 * Phone gestures for the one-screen public pages:
 * - swipe left / right drags the page toward the next / previous section in
 *   dock order, and lets go into it (or snaps back if the swipe was short);
 * - pull down from the top reloads the page (and drops the saved Lab crates so
 *   new mixes show up).
 *
 * Touch only — desktop keeps the dock. Anything with its own drag (Lab covers
 * and record, the Meet portrait, hanging logos, carousels, sliders, form
 * fields, dialogs) keeps its gesture: mark custom ones `data-route-swipe-block`.
 */
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useRouter } from 'next/navigation'

export const ROUTE_ORDER = ['/', '/events', '/lab', '/portfolio', '/meet', '/book'] as const

export type SwipeDirection = 'next' | 'prev'
export type SwipePhase = 'idle' | 'pulling' | 'settling' | 'leaving' | 'arriving'
export type RefreshState = { pull: number; ready: boolean; refreshing: boolean }

const INTENT_PX = 12
/** iOS / Android use the screen edges for their own back / forward swipe. */
const EDGE_PX = 22
const EXIT_MS = 160
const ARRIVE_MS = 200
const SETTLE_MS = 140
const REFRESH_AT = 70
const REFRESH_MAX = 110
const LAB_CRATES_CACHE = 'bae-lab-crates-v1'

const OWN_GESTURE = [
  'a[href]',
  'button',
  'summary',
  '[role="button"]',
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[role="slider"]',
  '[role="listbox"]',
  '[role="dialog"]',
  '[data-route-swipe-block]',
].join(',')

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function neighbourRoute(pathname: string, dx: number) {
  const index = ROUTE_ORDER.indexOf(pathname as (typeof ROUTE_ORDER)[number])
  if (index < 0 || dx === 0) return null
  const direction: SwipeDirection = dx < 0 ? 'next' : 'prev'
  const route = ROUTE_ORDER[index + (direction === 'next' ? 1 : -1)]
  return route ? { route, direction } : null
}

/** Inside something that scrolls sideways (e.g. the Events carousel)? */
function scrollsSideways(target: Element, root: Element) {
  for (let el: Element | null = target; el && el !== root; el = el.parentElement) {
    const { overflowX } = getComputedStyle(el)
    if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) return true
  }
  return false
}

/** Inside a scroller that isn't at its top (so a pull down should scroll it back up)? */
function scrolledDown(target: Element, root: Element) {
  for (let el: Element | null = target; el && el !== root; el = el.parentElement) {
    if (el.scrollTop > 0) {
      const { overflowY } = getComputedStyle(el)
      if (overflowY === 'auto' || overflowY === 'scroll') return true
    }
  }
  return false
}

/** The page itself is at its top (phones get a small root scroll runway). */
function pageAtTop() {
  return (document.scrollingElement?.scrollTop ?? window.scrollY) <= 0
}

/** Has the visitor typed or chosen anything in a form on this page? A reload would lose it. */
function hasUnsavedInput(root: Element) {
  return Array.from(root.querySelectorAll('input, textarea, select')).some((field) => {
    if (field instanceof HTMLSelectElement) {
      return Array.from(field.options).some((option) => option.selected !== option.defaultSelected)
    }
    if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
      return field.checked !== field.defaultChecked
    }
    if (field instanceof HTMLInputElement && (field.type === 'hidden' || field.type === 'range')) return false
    const text = field as HTMLInputElement | HTMLTextAreaElement
    return text.value !== text.defaultValue
  })
}

type Gesture = {
  x: number
  y: number
  at: number
  target: Element
  fromEdge: boolean
  /** Pull-to-refresh only from the very top, and never over unsent form input. */
  canRefresh: boolean
  mode: 'pending' | 'swipe' | 'refresh' | 'none'
}

export function useRouteGestures(shellRef: RefObject<HTMLDivElement | null>, pathname: string, enabled: boolean) {
  const router = useRouter()
  const [phase, setPhase] = useState<SwipePhase>('idle')
  const [direction, setDirection] = useState<SwipeDirection | null>(null)
  const [refresh, setRefresh] = useState<RefreshState>({ pull: 0, ready: false, refreshing: false })
  const [shownPath, setShownPath] = useState(pathname)
  const phaseRef = useRef(phase)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // The new page has arrived: let it slide in from the swipe side.
  if (pathname !== shownPath) {
    setShownPath(pathname)
    if (phase === 'leaving') setPhase('arriving')
  }

  useEffect(() => {
    if (phase !== 'arriving') return
    shellRef.current?.style.setProperty('--route-pull-x', '0px')
    const id = window.setTimeout(() => {
      setPhase('idle')
      setDirection(null)
    }, ARRIVE_MS)
    return () => window.clearTimeout(id)
  }, [phase, shellRef])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell || !enabled) return

    let gesture: Gesture | null = null
    let suppressClick = false
    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const setPullX = (px: number) => shell.style.setProperty('--route-pull-x', `${px}px`)
    const clearTimer = () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = null
    }

    function onStart(event: TouchEvent) {
      gesture = null
      if (!shell || event.touches.length !== 1 || phaseRef.current === 'leaving') return
      const target = event.target
      if (!(target instanceof Element) || target.closest(OWN_GESTURE)) return
      const touch = event.touches[0]
      gesture = {
        x: touch.clientX,
        y: touch.clientY,
        at: performance.now(),
        target,
        fromEdge: touch.clientX < EDGE_PX || touch.clientX > window.innerWidth - EDGE_PX,
        canRefresh: pageAtTop() && !hasUnsavedInput(shell),
        mode: 'pending',
      }
    }

    function onMove(event: TouchEvent) {
      if (!gesture || !shell) return
      if (event.touches.length !== 1) {
        cancel()
        return
      }
      const touch = event.touches[0]
      const dx = touch.clientX - gesture.x
      const dy = touch.clientY - gesture.y
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (gesture.mode === 'pending') {
        const pullingDown = gesture.canRefresh && dy > 0 && absY >= absX && !scrolledDown(gesture.target, shell)
        // Claim a downward pull straight away, before the browser scrolls or
        // starts its own refresh.
        if (pullingDown && event.cancelable) event.preventDefault()
        if (Math.max(absX, absY) < INTENT_PX) return

        if (absX > absY * 1.15 && !gesture.fromEdge && !scrollsSideways(gesture.target, shell)) {
          gesture.mode = 'swipe'
          suppressClick = true
          clearTimer()
          setPhase('pulling')
        } else if (pullingDown) {
          gesture.mode = 'refresh'
          suppressClick = true
        } else {
          gesture.mode = 'none'
          return
        }
      }

      if (gesture.mode === 'swipe') {
        if (event.cancelable) event.preventDefault()
        const width = window.innerWidth
        setDirection(dx < 0 ? 'next' : 'prev')
        // No page that way: give a little, then resist.
        setPullX(neighbourRoute(pathname, dx) ? clamp(dx, width * -0.72, width * 0.72) : clamp(dx * 0.18, -48, 48))
      } else if (gesture.mode === 'refresh') {
        if (event.cancelable) event.preventDefault()
        const pull = Math.min(REFRESH_MAX, dy * 0.5)
        setRefresh({ pull, ready: pull >= REFRESH_AT, refreshing: false })
      }
    }

    function settle() {
      setPhase('settling')
      setPullX(0)
      clearTimer()
      timer.current = window.setTimeout(() => {
        setPhase('idle')
        setDirection(null)
        timer.current = null
      }, SETTLE_MS)
    }

    function onEnd(event: TouchEvent) {
      const current = gesture
      gesture = null
      if (!current) return
      const touch = event.changedTouches[0]
      const dx = touch ? touch.clientX - current.x : 0
      const dy = touch ? touch.clientY - current.y : 0

      if (current.mode === 'swipe') {
        const destination = neighbourRoute(pathname, dx)
        const elapsed = Math.max(performance.now() - current.at, 1)
        const flick = Math.abs(dx) >= 40 && Math.abs(dx) / elapsed >= 0.55
        const far = Math.abs(dx) >= clamp(window.innerWidth * 0.16, 70, 140)
        if (destination && (far || flick)) {
          router.prefetch(destination.route)
          if (reducedMotion()) {
            setPullX(0)
            setPhase('idle')
            router.push(destination.route)
          } else {
            setDirection(destination.direction)
            setPhase('leaving')
            clearTimer()
            timer.current = window.setTimeout(() => {
              router.push(destination.route)
              timer.current = null
            }, EXIT_MS)
          }
        } else {
          settle()
        }
      } else if (current.mode === 'refresh') {
        const pull = Math.min(REFRESH_MAX, dy * 0.5)
        if (pull >= REFRESH_AT) {
          setRefresh({ pull: REFRESH_AT, ready: true, refreshing: true })
          try {
            window.localStorage.removeItem(LAB_CRATES_CACHE)
          } catch {
            // Storage blocked: the reload still fetches the page fresh.
          }
          window.location.reload()
        } else {
          setRefresh({ pull: 0, ready: false, refreshing: false })
        }
      }

      // The finger lifted off whatever it started on; don't let that count as a tap.
      window.setTimeout(() => {
        suppressClick = false
      }, 80)
    }

    function cancel() {
      const current = gesture
      gesture = null
      if (current?.mode === 'swipe') settle()
      if (current?.mode === 'refresh') setRefresh({ pull: 0, ready: false, refreshing: false })
      suppressClick = false
    }

    function onClick(event: MouseEvent) {
      if (!suppressClick) return
      event.preventDefault()
      event.stopPropagation()
      suppressClick = false
    }

    shell.addEventListener('touchstart', onStart, { passive: true })
    shell.addEventListener('touchmove', onMove, { passive: false })
    shell.addEventListener('touchend', onEnd)
    shell.addEventListener('touchcancel', cancel)
    shell.addEventListener('click', onClick, true)
    return () => {
      shell.removeEventListener('touchstart', onStart)
      shell.removeEventListener('touchmove', onMove)
      shell.removeEventListener('touchend', onEnd)
      shell.removeEventListener('touchcancel', cancel)
      shell.removeEventListener('click', onClick, true)
    }
  }, [enabled, pathname, router, shellRef])

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  return { phase, direction, refresh }
}
