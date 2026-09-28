'use client'

/**
 * SITE-WIDE MIX PLAYER
 * One hidden SoundCloud widget that lives in the public shell, so a mix keeps
 * playing while visitors move between pages. The Lab cues and plays from its
 * crates; the top-bar pill reads the same state everywhere else.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { loadSoundCloudApi, widgetSrc, WIDGET_OPTIONS, type SoundCloudWidget } from './soundcloud'

export type PlayerMix = {
  id: string
  title: string
  description: string | null
  genre: string | null
  embed_url: string | null
  cover_url: string | null
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused'

/** The SoundCloud track URL behind an embed_url (a permalink or a widget URL). */
export function trackUrl(url: string | null): string {
  if (!url) return ''
  if (url.includes('w.soundcloud.com/player')) {
    try {
      return new URL(url).searchParams.get('url') ?? ''
    } catch {
      return ''
    }
  }
  return url.toLowerCase().includes('soundcloud.com') ? url : ''
}

/** A public soundcloud.com link for the mix, when the embed gives us one. */
export function permalinkFor(url: string | null): string {
  const track = trackUrl(url)
  return track && !track.includes('api.soundcloud.com') ? track : ''
}

function playable(mixes: PlayerMix[]) {
  return mixes.filter((mix) => trackUrl(mix.embed_url))
}

type PlayerContextValue = {
  queue: PlayerMix[]
  index: number
  current: PlayerMix | null
  status: PlayerStatus
  position: number
  duration: number
  permalink: string
  /** Has the visitor started anything yet? Controls the top-bar pill. */
  engaged: boolean
  /** Put a mix on the platter without playing it — only if nothing is loaded yet. */
  cue: (mixes: PlayerMix[], index?: number) => void
  /** Play `mixes[index]` and make `mixes` the queue for next / previous. */
  playFrom: (mixes: PlayerMix[], index: number) => void
  toggle: () => void
  next: () => void
  previous: () => void
  seek: (fraction: number) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer() {
  const value = useContext(PlayerContext)
  if (!value) throw new Error('usePlayer must be used inside PlayerProvider')
  return value
}

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<PlayerMix[]>([])
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [soundPermalink, setSoundPermalink] = useState('')
  const [engaged, setEngaged] = useState(false)
  const [frameSrc, setFrameSrc] = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<SoundCloudWidget | null>(null)
  const loadedTrackRef = useRef('')
  const queueRef = useRef<PlayerMix[]>([])
  const indexRef = useRef(0)
  const nextRef = useRef<() => void>(() => {})
  // A play requested before the widget was ready — remembers WHICH track.
  const pendingPlayRef = useRef<string | null>(null)
  const readyRef = useRef(false)

  const current = queue[index] ?? null

  const refreshSoundInfo = useCallback(() => {
    const widget = widgetRef.current
    if (!widget) return
    widget.getDuration((ms) => setDuration(ms || 0))
    widget.getCurrentSound((sound) => setSoundPermalink(sound?.permalink_url ?? ''))
  }, [])

  const adoptQueue = useCallback((mixes: PlayerMix[], nextIndex: number) => {
    queueRef.current = mixes
    indexRef.current = nextIndex
    setQueue(mixes)
    setIndex(nextIndex)
  }, [])

  const cue = useCallback((mixes: PlayerMix[], cueIndex = 0) => {
    if (loadedTrackRef.current) return
    const list = playable(mixes)
    const mix = list[cueIndex] ?? list[0]
    if (!mix) return
    adoptQueue(list, list.indexOf(mix))
    const track = trackUrl(mix.embed_url)
    loadedTrackRef.current = track
    setFrameSrc(widgetSrc(track))
  }, [adoptQueue])

  const loadAndPlay = useCallback((widget: SoundCloudWidget, track: string) => {
    loadedTrackRef.current = track
    setStatus('loading')
    setPosition(0)
    setDuration(0)
    setSoundPermalink('')
    widget.load(track, {
      ...WIDGET_OPTIONS,
      auto_play: true,
      callback: () => {
        refreshSoundInfo()
        widget.play()
      },
    })
  }, [refreshSoundInfo])

  const startTrack = useCallback((track: string) => {
    const widget = widgetRef.current
    if (!widget || !readyRef.current) {
      // Not ready yet: remember the exact track and start it on READY.
      pendingPlayRef.current = track
      setStatus('loading')
      return
    }
    if (track === loadedTrackRef.current) {
      widget.play()
      return
    }
    loadAndPlay(widget, track)
  }, [loadAndPlay])

  const playFrom = useCallback((mixes: PlayerMix[], playIndex: number) => {
    const list = playable(mixes)
    const mix = mixes[playIndex]
    const nextIndex = mix ? list.findIndex((item) => item.id === mix.id) : -1
    if (nextIndex < 0) return
    setEngaged(true)
    adoptQueue(list, nextIndex)
    const track = trackUrl(list[nextIndex].embed_url)
    if (!frameSrc) {
      // First play ever: create the widget already pointed at this track.
      loadedTrackRef.current = track
      pendingPlayRef.current = track
      setStatus('loading')
      setFrameSrc(widgetSrc(track))
      return
    }
    startTrack(track)
  }, [adoptQueue, frameSrc, startTrack])

  const toggle = useCallback(() => {
    const widget = widgetRef.current
    if (!widget || !readyRef.current) {
      if (loadedTrackRef.current) {
        setEngaged(true)
        startTrack(pendingPlayRef.current ?? loadedTrackRef.current)
      }
      return
    }
    if (status === 'playing' || status === 'loading') {
      widget.pause()
    } else {
      setEngaged(true)
      widget.play()
    }
  }, [status, startTrack])

  const next = useCallback(() => {
    const list = queueRef.current
    if (list.length > 1) playFrom(list, (indexRef.current + 1) % list.length)
  }, [playFrom])

  const previous = useCallback(() => {
    const list = queueRef.current
    if (list.length === 0) return
    // Like most players: restart the mix unless we're right at the start.
    if (position > 4000 || list.length === 1) {
      widgetRef.current?.seekTo(0)
      setPosition(0)
      return
    }
    playFrom(list, (indexRef.current - 1 + list.length) % list.length)
  }, [playFrom, position])

  const seek = useCallback((fraction: number) => {
    if (!widgetRef.current || !duration) return
    const ms = Math.max(0, Math.min(1, fraction)) * duration
    widgetRef.current.seekTo(ms)
    setPosition(ms)
  }, [duration])

  useEffect(() => {
    nextRef.current = next
  }, [next])

  // Wire the widget once the iframe exists.
  useEffect(() => {
    if (!frameSrc || widgetRef.current) return
    let cancelled = false
    let boundWidget: SoundCloudWidget | null = null
    const boundEvents: string[] = []

    loadSoundCloudApi().then((SC) => {
      if (cancelled || !iframeRef.current || widgetRef.current) return
      const widget = SC.Widget(iframeRef.current)
      widgetRef.current = widget
      boundWidget = widget
      const events = SC.Widget.Events ?? {}
      const bind = (
        eventName: string | undefined,
        listener: (event?: { currentPosition?: number }) => void,
      ) => {
        if (!eventName) return
        widget.bind(eventName, listener)
        boundEvents.push(eventName)
      }

      if (events.READY) {
        bind(events.READY, () => {
          readyRef.current = true
          refreshSoundInfo()
          const pending = pendingPlayRef.current
          if (!pending) return
          pendingPlayRef.current = null
          if (pending === loadedTrackRef.current) widget.play()
          else loadAndPlay(widget, pending)
        })
      }
      if (events.PLAY) {
        bind(events.PLAY, () => {
          setStatus('playing')
          refreshSoundInfo()
        })
      }
      if (events.PAUSE) bind(events.PAUSE, () => setStatus('paused'))
      if (events.FINISH) {
        bind(events.FINISH, () => {
          setStatus('paused')
          if (queueRef.current.length > 1) nextRef.current()
        })
      }
      if (events.PLAY_PROGRESS) {
        // SoundCloud reports progress many times a second; a clock only needs
        // ~4 updates a second, and each update re-renders every player consumer.
        let lastTick = 0
        bind(events.PLAY_PROGRESS, (event) => {
          const now = performance.now()
          if (now - lastTick < 250 || typeof event?.currentPosition !== 'number') return
          lastTick = now
          setPosition(event.currentPosition)
        })
      }
    }).catch(() => {
      // Audio simply stays unavailable; the Lab shows its SoundCloud link.
    })

    return () => {
      cancelled = true
      if (boundWidget) {
        for (const eventName of boundEvents) boundWidget.unbind(eventName)
        if (widgetRef.current === boundWidget) widgetRef.current = null
      }
      readyRef.current = false
    }
  }, [frameSrc, refreshSoundInfo, loadAndPlay])

  const permalink = soundPermalink || permalinkFor(current?.embed_url ?? null)

  const value = useMemo<PlayerContextValue>(() => ({
    queue,
    index,
    current,
    status,
    position,
    duration,
    permalink,
    engaged,
    cue,
    playFrom,
    toggle,
    next,
    previous,
    seek,
  }), [queue, index, current, status, position, duration, permalink, engaged, cue, playFrom, toggle, next, previous, seek])

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {frameSrc ? (
        <iframe
          ref={iframeRef}
          title="DJ B.A.E. mix player"
          src={frameSrc}
          allow="autoplay"
          tabIndex={-1}
          aria-hidden="true"
          // Invisible but inside the viewport: browsers throttle off-screen
          // cross-origin iframes, which can stall playback on phones.
          style={{
            position: 'fixed',
            width: 1,
            height: 1,
            left: 0,
            bottom: 0,
            border: 0,
            opacity: 0.01,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </PlayerContext.Provider>
  )
}
