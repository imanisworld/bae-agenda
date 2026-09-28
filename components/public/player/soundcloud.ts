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

/** Loads the widget API once and resolves with window.SC. */
export function loadSoundCloudApi(): Promise<SoundCloudNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SoundCloud API is client-only'))
  if (window.SC) return Promise.resolve(window.SC)
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = API_SRC
      script.async = true
      script.onload = () => (window.SC ? resolve(window.SC) : reject(new Error('SoundCloud API missing')))
      script.onerror = () => {
        apiPromise = null
        reject(new Error('SoundCloud API failed to load'))
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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function readAllSounds(widget: SoundCloudWidget, timeoutMs: number): Promise<SoundCloudSound[]> {
  const started = Date.now()
  let sounds: SoundCloudSound[] = []
  while (Date.now() - started < timeoutMs) {
    sounds = await new Promise<SoundCloudSound[]>((resolve) => widget.getSounds(resolve))
    if (sounds.length > 0 && sounds.every((sound) => sound.title)) break
    await wait(700)
  }
  return sounds.filter((sound) => sound.title && sound.permalink_url)
}

/**
 * Reads every track in each public playlist, using ONE hidden widget that loads
 * the playlists one after another (each widget is ~12 MB of memory, so we never
 * run more than one extra). The widget hands over full details for the first
 * few tracks immediately and fills in the rest a moment later, so we poll until
 * every track has a title (or give up and keep what we have).
 */
export async function fetchPlaylists(
  playlistUrls: string[],
  onPlaylist?: (index: number, sounds: SoundCloudSound[]) => void,
  timeoutMs = 14000,
): Promise<SoundCloudSound[][]> {
  if (playlistUrls.length === 0) return []
  const SC = await loadSoundCloudApi()
  const readyEvent = SC.Widget.Events?.READY ?? 'ready'
  const iframe = document.createElement('iframe')
  iframe.src = widgetSrc(playlistUrls[0])
  iframe.title = 'SoundCloud playlist loader'
  iframe.setAttribute('aria-hidden', 'true')
  iframe.tabIndex = -1
  iframe.style.cssText = 'position:fixed;left:-9999px;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none'
  document.body.appendChild(iframe)

  const results: SoundCloudSound[][] = []
  try {
    const widget = SC.Widget(iframe)
    const ready = await Promise.race([
      new Promise<boolean>((resolve) => widget.bind(readyEvent, () => resolve(true))),
      wait(timeoutMs).then(() => false),
    ])
    if (!ready) return playlistUrls.map(() => [])
    widget.unbind(readyEvent)
    results.push(await readAllSounds(widget, timeoutMs))
    onPlaylist?.(0, results[0])

    for (const url of playlistUrls.slice(1)) {
      const loaded = await Promise.race([
        new Promise<boolean>((resolve) => widget.load(url, { ...WIDGET_OPTIONS, auto_play: false, callback: () => resolve(true) })),
        wait(timeoutMs).then(() => false),
      ])
      const sounds = loaded ? await readAllSounds(widget, timeoutMs) : []
      results.push(sounds)
      onPlaylist?.(results.length - 1, sounds)
    }
    return results
  } catch {
    return playlistUrls.map((_, i) => results[i] ?? [])
  } finally {
    iframe.remove()
  }
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
