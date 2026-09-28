'use client'

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Nav from '@/components/public/Nav'
import PublicPageStage from '@/components/public/PublicPageStage'
import PlayerProvider from '@/components/public/player/PlayerProvider'

const EXPERIENCE_ROUTE_ORDER = ['/', '/events', '/lab', '/portfolio', '/meet', '/book'] as const
const EXPERIENCE_ROUTES = new Set<string>(EXPERIENCE_ROUTE_ORDER)
const EXIT_DELAY_MS = 280
const ARRIVAL_CLEAR_MS = 440
const SNAP_BACK_MS = 190
const SWIPE_INTENT_PX = 12

type RouteDirection = 'next' | 'prev'
type PullState = 'idle' | 'pulling' | 'settling'
type PullGesture = {
  pointerId: number
  startX: number
  startY: number
  startedAt: number
  engaged: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function routeForPull(pathname: string, dx: number) {
  const index = EXPERIENCE_ROUTE_ORDER.indexOf(pathname as (typeof EXPERIENCE_ROUTE_ORDER)[number])
  if (index < 0 || dx === 0) return null

  const direction: RouteDirection = dx < 0 ? 'next' : 'prev'
  const nextIndex = index + (direction === 'next' ? 1 : -1)
  const route = EXPERIENCE_ROUTE_ORDER[nextIndex]
  return route ? { route, direction } : null
}

function blocksPagePull(target: Element) {
  return Boolean(target.closest([
    'a',
    'button',
    'input',
    'textarea',
    'select',
    'video',
    'audio',
    '[contenteditable="true"]',
    '[role="button"]',
    '[role="slider"]',
    '[role="listbox"]',
    '[role="dialog"]',
    '[data-route-swipe-block]',
  ].join(',')))
}

export default function PublicExperienceShell({
  children,
  footer,
  sticky,
}: {
  children: React.ReactNode
  footer: React.ReactNode
  sticky: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const experienceMode = EXPERIENCE_ROUTES.has(pathname)
  const [departingFrom, setDepartingFrom] = useState<string | null>(null)
  const [transitionDirection, setTransitionDirection] = useState<RouteDirection | null>(null)
  const [pullState, setPullState] = useState<PullState>('idle')
  const [showSidewaysCue, setShowSidewaysCue] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const pullGesture = useRef<PullGesture | null>(null)
  const navigationTimer = useRef<number | null>(null)
  const arrivalTimer = useRef<number | null>(null)
  const settleTimer = useRef<number | null>(null)

  const leaving = departingFrom === pathname
  const arriving = departingFrom !== null && departingFrom !== pathname

  function clearTimer(ref: { current: number | null }) {
    if (ref.current !== null) {
      window.clearTimeout(ref.current)
      ref.current = null
    }
  }

  function setPullOffset(px: number) {
    shellRef.current?.style.setProperty('--route-pull-x', `${px}px`)
  }

  function settlePull() {
    setPullState('settling')
    setPullOffset(0)
    clearTimer(settleTimer)
    settleTimer.current = window.setTimeout(() => {
      setPullState('idle')
      setTransitionDirection(null)
      settleTimer.current = null
    }, SNAP_BACK_MS)
  }

  function beginPullNavigation(destination: string, direction: RouteDirection) {
    if (leaving) return
    router.prefetch(destination)
    clearTimer(navigationTimer)
    clearTimer(arrivalTimer)
    clearTimer(settleTimer)
    setTransitionDirection(direction)
    setPullState('idle')
    setDepartingFrom(pathname)

    navigationTimer.current = window.setTimeout(() => {
      router.push(destination)
      navigationTimer.current = null
    }, EXIT_DELAY_MS)
  }

  useEffect(() => {
    if (!arriving) return
    setPullOffset(0)
    clearTimer(arrivalTimer)
    arrivalTimer.current = window.setTimeout(() => {
      setDepartingFrom(null)
      setTransitionDirection(null)
      arrivalTimer.current = null
    }, ARRIVAL_CLEAR_MS)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!experienceMode) return
    if (!window.matchMedia('(max-width: 1024px)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.sessionStorage.getItem('bae-sideways-cue-seen')) return

    const showTimer = window.setTimeout(() => {
      setShowSidewaysCue(true)
      window.sessionStorage.setItem('bae-sideways-cue-seen', '1')
    }, 350)
    const hideTimer = window.setTimeout(() => setShowSidewaysCue(false), 3600)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [experienceMode])

  useEffect(() => {
    return () => {
      clearTimer(navigationTimer)
      clearTimer(arrivalTimer)
      clearTimer(settleTimer)
    }
  }, [])

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!experienceMode || leaving || arriving || event.button !== 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const target = event.target
    if (!(target instanceof Element) || blocksPagePull(target)) return

    pullGesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
      engaged: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = pullGesture.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (!gesture.engaged) {
      if (Math.max(absX, absY) < SWIPE_INTENT_PX) return

      if (absY > absX * 0.85) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        pullGesture.current = null
        return
      }

      gesture.engaged = true
      setPullState('pulling')
    }

    const destination = routeForPull(pathname, dx)
    setTransitionDirection(dx < 0 ? 'next' : 'prev')

    const width = Math.max(window.innerWidth, 1)
    const pull = destination
      ? clamp(dx, width * -0.72, width * 0.72)
      : clamp(dx * 0.18, -54, 54)

    setPullOffset(pull)
    event.preventDefault()
  }

  function finishPointer(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    const gesture = pullGesture.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const dx = event.clientX - gesture.startX
    const elapsed = Math.max(performance.now() - gesture.startedAt, 1)
    const velocity = Math.abs(dx) / elapsed
    const destination = routeForPull(pathname, dx)
    const threshold = clamp(window.innerWidth * 0.16, 76, 150)
    const committed = !cancelled
      && gesture.engaged
      && destination
      && (Math.abs(dx) >= threshold || (Math.abs(dx) >= 42 && velocity >= 0.55))

    pullGesture.current = null

    if (committed && destination) {
      beginPullNavigation(destination.route, destination.direction)
    } else if (gesture.engaged) {
      settlePull()
    } else {
      setPullOffset(0)
      setPullState('idle')
      setTransitionDirection(null)
    }
  }

  return (
    <PlayerProvider>
      <div
        ref={shellRef}
        data-route-direction={transitionDirection ?? undefined}
        className={
          experienceMode
            ? [
                'public-experience-shell',
                leaving ? 'public-experience-shell--leaving' : '',
                arriving ? 'public-experience-shell--arriving' : '',
                pullState === 'pulling' ? 'public-experience-shell--pulling' : '',
                pullState === 'settling' ? 'public-experience-shell--settling' : '',
              ].filter(Boolean).join(' ')
            : 'public-site-shell'
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => finishPointer(event)}
        onPointerCancel={(event) => finishPointer(event, true)}
      >
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Nav />
        {showSidewaysCue && experienceMode ? (
          <div className="public-sideways-cue" aria-hidden="true">
            <span>←</span>
            <i />
            <span>→</span>
          </div>
        ) : null}
        {!experienceMode ? sticky : null}
        <main
          id="main-content"
          tabIndex={-1}
          className={experienceMode ? 'public-experience-main' : undefined}
          aria-busy={leaving || undefined}
        >
          <PublicPageStage>{children}</PublicPageStage>
        </main>
        {!experienceMode ? footer : null}
      </div>
    </PlayerProvider>
  )
}
