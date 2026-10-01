/**
 * SOUNDCLOUD WIDGET HELPERS (client only)
 * The public widget API needs no key. We use it both to play audio and to read
 * the tracks in DJ B.A.E.'s public playlists, so the Lab stays in sync with
 * SoundCloud without anyone re-entering mixes in admin.
 */
import type { PlayerMix } from './PlayerProvider'

export type SoundCloudSound = {
  id?: number
  title?: string
  artwork_url?: string | null
  permalink_url?: string
  duration?: number
  genre?: string | null
  description?: string | null
}

export type SoundCloudWidget = {
  play: () => void
  pause: () => void
  seekTo: (ms: number) => void
  getDuration: (cb: (ms: number) => void) => void
  getCurrentSound: (cb: (sound: SoundCloudSound | null) => void) => void
  getSounds: (cb: (sounds: SoundCloudSound[]) => void) => void
  load: (url: string, options?: Record<string, unknown>) => void
  bind: (eventName: string, listener: (event?: { currentPosition?: number }) => void) => void
  unbind: (eventName: string) => void
}

type SoundCloudNamespace = {
  Widget: ((iframe: HTMLIFrameElement) => SoundCloudWidget) & {
    Events?: Record<string, string>
  }
}

declare global {
  interface Window {
    SC?: SoundCloudNamespace
  }
}

export const WIDGET_OPTIONS = {
  color: '#8f2d3c',
  hide_related: true,
  show_comments: false,
  show_user: false,
  show_reposts: false,
  visual: false,
}

const API_SRC = 'https://w.soundcloud.com/player/api.js'
let apiPromise: Promise<SoundCloudNamespace> | null = null

const API_TIMEOUT_MS = 10000

/**
 * Invisible 1px box that stays INSIDE the viewport. Browsers (iOS Safari in
 * particular) throttle or stall cross-origin iframes parked off-screen, which
 * left the Lab stuck loading on phones.
 */
export const HIDDEN_FRAME_STYLE =
  'position:fixed;left:0;bottom:0;width:1px;height:1px;border:0;opacity:0.01;pointer-events:none'

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

/** Resolves with `fallback` if `promise` hasn't settled in time — nothing here may hang. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, wait(ms).then(() => fallback)])
}

/** Loads the widget API once and resolves with window.SC (rejects after 10s). */
export function loadSoundCloudApi(): Promise<SoundCloudNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SoundCloud API is client-only'))
  if (window.SC) return Promise.resolve(window.SC)
  if (!apiPromise) {
    apiPromise = new Promise<SoundCloudNamespace>((resolve, reject) => {
      const fail = (message: string) => {
        apiPromise = null
        reject(new Error(message))
      }
      const timer = window.setTimeout(() => fail('SoundCloud API timed out'), API_TIMEOUT_MS)
      const script = document.createElement('script')
      script.src = API_SRC
      script.async = true
      script.onload = () => {
        window.clearTimeout(timer)
        if (window.SC) resolve(window.SC)
        else fail('SoundCloud API missing')
      }
      script.onerror = () => {
        window.clearTimeout(timer)
        fail('SoundCloud API failed to load')
      }
      document.head.appendChild(script)
    })
  }
  return apiPromise
}

export function widgetSrc(url: string, autoPlay = false) {
  const params = new URLSearchParams({ url, auto_play: String(autoPlay) })
  Object.entries(WIDGET_OPTIONS).forEach(([key, value]) => params.set(key, String(value)))
  return `https://w.soundcloud.com/player/?${params.toString()}`
}

function titled(sounds: SoundCloudSound[]) {
  return sounds.filter((sound) => sound.title && sound.permalink_url)
}

/**
 * The widget hands over full details for the first few tracks at once and fills
 * in the rest a moment later. Poll, reporting each time more tracks arrive, and
 * stop when every track is in, nothing new shows up for a while, or time runs out.
 */
async function readAllSounds(
  widget: SoundCloudWidget,
  onProgress: (sounds: SoundCloudSound[]) => void,
  maxMs = 9000,
): Promise<SoundCloudSound[]> {
  const started = Date.now()
  let best: SoundCloudSound[] = []
  let lastGrowth = Date.now()
  while (Date.now() - started < maxMs) {
    const sounds = await withTimeout(
      new Promise<SoundCloudSound[]>((resolve) => widget.getSounds(resolve)),
      3000,
      [] as SoundCloudSound[],
    )
    const ready = titled(sounds)
    if (ready.length > best.length) {
      best = ready
      lastGrowth = Date.now()
      onProgress(best)
    }
    if (sounds.length > 0 && ready.length === sounds.length) break
    if (best.length > 0 && Date.now() - lastGrowth > 4000) break
    await wait(600)
  }
  return best
}

/**
 * Reads every track in each public playlist, using ONE hidden widget that loads
 * the playlists one after another (each widget is ~12 MB of memory, so we never
 * run more than one extra). `onPlaylist` fires as tracks arrive, so the Lab can
 * show a crate before it's complete. Every step has a time limit.
 */
export async function fetchPlaylists(
  playlistUrls: string[],
  onPlaylist?: (index: number, sounds: SoundCloudSound[]) => void,
  stepTimeoutMs = 10000,
): Promise<SoundCloudSound[][]> {
  if (playlistUrls.length === 0) return []
  const SC = await loadSoundCloudApi()
  const readyEvent = SC.Widget.Events?.READY ?? 'ready'
  const iframe = document.createElement('iframe')
  iframe.src = widgetSrc(playlistUrls[0])
  iframe.title = 'SoundCloud playlist loader'
  iframe.setAttribute('aria-hidden', 'true')
  iframe.tabIndex = -1
  iframe.style.cssText = HIDDEN_FRAME_STYLE
  document.body.appendChild(iframe)

  const results: SoundCloudSound[][] = playlistUrls.map(() => [])
  try {
    const widget = SC.Widget(iframe)
    const ready = await withTimeout(
      new Promise<boolean>((resolve) => widget.bind(readyEvent, () => resolve(true))),
      stepTimeoutMs,
      false,
    )
    if (!ready) return results
    widget.unbind(readyEvent)

    for (let i = 0; i < playlistUrls.length; i++) {
      if (i > 0) {
        const loaded = await withTimeout(
          new Promise<boolean>((resolve) =>
            widget.load(playlistUrls[i], { ...WIDGET_OPTIONS, auto_play: false, callback: () => resolve(true) }),
          ),
          stepTimeoutMs,
          false,
        )
        if (!loaded) continue
      }
      results[i] = await readAllSounds(widget, (sounds) => {
        results[i] = sounds
        onPlaylist?.(i, sounds)
      })
    }
    return results
  } catch {
    return results
  } finally {
    iframe.remove()
  }
}

/**
 * Tracks without their own artwork carry the account's default card: black
 * `<dj_b.a.e>` type baked onto a white JPEG. That white can't be made
 * transparent, so the site shows the transparent brand mark instead.
 * Other artwork (including the black Mashups card) is left alone.
 */
const BRAND_CARD_ARTWORK = ['artworks-N0S3aX1KSXvz9Knz-mV9b3Q']
export const BRAND_MARK_SRC = '/brand/dj-bae-logo.png'

export function isBrandCardArtwork(url: string | null | undefined) {
  return Boolean(url && BRAND_CARD_ARTWORK.some((id) => url.includes(id)))
}

/** SoundCloud serves small artwork by default; ask for the 500px version. */
export function largeArtwork(url: string | null | undefined) {
  return url ? url.replace('-large.', '-t500x500.') : null
}

export function soundToMix(sound: SoundCloudSound): PlayerMix & { duration: number | null } {
  return {
    id: `sc-${sound.id ?? sound.permalink_url}`,
    title: sound.title ?? 'Untitled',
    description: sound.description?.trim() || null,
    genre: sound.genre?.trim() || null,
    embed_url: sound.permalink_url ?? null,
    cover_url: largeArtwork(sound.artwork_url),
    duration: sound.duration ? Math.round(sound.duration / 1000) : null,
  }
}
