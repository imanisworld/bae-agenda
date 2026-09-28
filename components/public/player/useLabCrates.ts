'use client'

import { useEffect, useState } from 'react'
import { LAB_CRATES } from '@/lib/constants'
import { trackUrl, type PlayerMix } from './PlayerProvider'
import { fetchPlaylists, soundToMix, type SoundCloudSound } from './soundcloud'

export type CrateMix = PlayerMix & { duration: number | null }

export type Crate = {
  key: string
  label: string
  url: string
  mixes: CrateMix[]
}

export type CratesState =
  | { status: 'loading'; crates: Crate[] }
  | { status: 'ready'; crates: Crate[] }

const CACHE_KEY = 'bae-lab-crates-v1'
/** Newer than this: use as-is. Older (up to MAX_AGE): show instantly, refresh quietly. */
const CACHE_FRESH_MS = 6 * 60 * 60 * 1000
const CACHE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
/** If SoundCloud hasn't answered by now, show the admin mixes rather than a loader. */
const FALLBACK_AFTER_MS = 5000

function normalize(url: string | null) {
  return trackUrl(url).toLowerCase().split('?')[0].replace(/\/+$/, '')
}

function readCache(): { crates: Crate[]; fresh: boolean } | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; crates: Crate[] }
    const age = Date.now() - parsed.at
    if (!Array.isArray(parsed.crates) || age > CACHE_MAX_AGE_MS) return null
    const expected = LAB_CRATES.map((crate) => crate.url).join('|')
    if (parsed.crates.map((crate) => crate.url).join('|') !== expected) return null
    return { crates: parsed.crates, fresh: age <= CACHE_FRESH_MS }
  } catch {
    return null
  }
}

function writeCache(crates: Crate[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), crates }))
  } catch {
    // Storage unavailable (private mode, quota) — the next visit just refetches.
  }
}

/** Admin-curated copy wins over SoundCloud's for the same track. */
function mergeAdminCopy(crates: Crate[], adminMixes: CrateMix[]): Crate[] {
  const byUrl = new Map(adminMixes.map((mix) => [normalize(mix.embed_url), mix]))
  return crates.map((crate) => ({
    ...crate,
    mixes: crate.mixes.map((mix) => {
      const admin = byUrl.get(normalize(mix.embed_url))
      if (!admin) return mix
      return {
        ...mix,
        description: admin.description || mix.description,
        genre: admin.genre || mix.genre,
        cover_url: admin.cover_url || mix.cover_url,
      }
    }),
  }))
}

function adminFallback(adminMixes: CrateMix[]): Crate[] {
  return [{ key: 'mixes', label: 'Mixes', url: '', mixes: adminMixes }]
}

/**
 * The Lab's crates, read live from DJ B.A.E.'s SoundCloud playlists.
 * Never leaves the visitor on a loader: saved crates show instantly (and refresh
 * quietly when old), and if SoundCloud is slow or blocked the admin-published
 * mixes appear after a few seconds, swapped for the full crates if they arrive.
 */
export function useLabCrates(adminMixes: CrateMix[]): CratesState {
  const [state, setState] = useState<CratesState>({ status: 'loading', crates: [] })

  useEffect(() => {
    let cancelled = false
    let shownSoundCloud = false
    const show = (crates: Crate[]) => {
      if (!cancelled) setState({ status: 'ready', crates })
    }

    const cached = readCache()
    if (cached) {
      shownSoundCloud = true
      // Deferred so the first paint matches the server render.
      window.setTimeout(() => show(mergeAdminCopy(cached.crates, adminMixes)), 0)
      if (cached.fresh) return () => { cancelled = true }
    }

    const fallbackTimer = window.setTimeout(() => {
      if (!shownSoundCloud && adminMixes.length) show(adminFallback(adminMixes))
    }, FALLBACK_AFTER_MS)

    const toCrates = (results: (SoundCloudSound[] | undefined)[]): Crate[] =>
      LAB_CRATES.map((crate, i) => ({
        key: crate.key,
        label: crate.label,
        url: crate.url,
        mixes: (results[i] ?? []).map(soundToMix),
      }))
    const partial: (SoundCloudSound[] | undefined)[] = []

    // A background refresh of saved crates stays silent until it's complete,
    // so nothing shuffles under the visitor; a first visit shows crates as they arrive.
    fetchPlaylists(LAB_CRATES.map((crate) => crate.url), (index, sounds) => {
      if (cancelled || cached) return
      partial[index] = sounds
      const filled = toCrates(partial).filter((crate) => crate.mixes.length > 0)
      if (filled.length > 0) {
        shownSoundCloud = true
        show(mergeAdminCopy(filled, adminMixes))
      }
    })
      .catch(() => [] as SoundCloudSound[][])
      .then((results) => {
        window.clearTimeout(fallbackTimer)
        if (cancelled) return
        const loaded = toCrates(results)
        const filled = loaded.filter((crate) => crate.mixes.length > 0)
        if (filled.length === 0) {
          // Nothing from SoundCloud: keep saved crates if we had them, else admin mixes.
          if (!cached) show(adminMixes.length ? adminFallback(adminMixes) : [])
          return
        }
        const complete = filled.length === loaded.length
        // A partial background refresh never replaces a complete saved set.
        if (cached && !complete) return
        // Only cache a complete read so a flaky load doesn't stick around.
        if (complete) writeCache(filled)
        show(mergeAdminCopy(filled, adminMixes))
      })

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
    }
  }, [adminMixes])

  return state
}
