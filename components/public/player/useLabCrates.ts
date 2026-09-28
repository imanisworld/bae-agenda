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
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

function normalize(url: string | null) {
  return trackUrl(url).toLowerCase().split('?')[0].replace(/\/+$/, '')
}

function readCache(): Crate[] | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; crates: Crate[] }
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null
    const expected = LAB_CRATES.map((crate) => crate.url).join('|')
    if (parsed.crates.map((crate) => crate.url).join('|') !== expected) return null
    return parsed.crates
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
 * Falls back to the admin-published mixes if SoundCloud can't be reached.
 */
export function useLabCrates(adminMixes: CrateMix[]): CratesState {
  const [state, setState] = useState<CratesState>({ status: 'loading', crates: [] })

  useEffect(() => {
    let cancelled = false

    const cached = readCache()
    if (cached) {
      // Deferred so the first paint matches the server render.
      window.setTimeout(() => {
        if (!cancelled) setState({ status: 'ready', crates: mergeAdminCopy(cached, adminMixes) })
      }, 0)
      return () => { cancelled = true }
    }

    const toCrates = (results: (SoundCloudSound[] | undefined)[]): Crate[] =>
      LAB_CRATES.map((crate, i) => ({
        key: crate.key,
        label: crate.label,
        url: crate.url,
        mixes: (results[i] ?? []).map(soundToMix),
      }))
    const partial: (SoundCloudSound[] | undefined)[] = []

    // Show each crate as soon as it's read, so the first one appears quickly.
    fetchPlaylists(LAB_CRATES.map((crate) => crate.url), (index, sounds) => {
      if (cancelled) return
      partial[index] = sounds
      const filled = toCrates(partial).filter((crate) => crate.mixes.length > 0)
      if (filled.length > 0) setState({ status: 'ready', crates: mergeAdminCopy(filled, adminMixes) })
    })
      .catch(() => [])
      .then((results) => {
        if (cancelled) return
        const loaded = toCrates(results)
        const filled = loaded.filter((crate) => crate.mixes.length > 0)
        if (filled.length === 0) {
          setState({ status: 'ready', crates: adminMixes.length ? adminFallback(adminMixes) : [] })
          return
        }
        // Only cache a complete read so a flaky load doesn't stick for hours.
        if (filled.length === loaded.length) writeCache(filled)
        setState({ status: 'ready', crates: mergeAdminCopy(filled, adminMixes) })
      })

    return () => { cancelled = true }
  }, [adminMixes])

  return state
}
