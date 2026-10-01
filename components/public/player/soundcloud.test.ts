import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The Lab once hung forever on "Pulling the crates…" when SoundCloud's hidden
 * widget stopped answering (seen on phones). These tests drive a fake widget
 * that never replies and prove every step gives up on its own.
 */

type Sound = { id: number; title?: string; permalink_url?: string }

type FakeWidgetOptions = {
  ready?: boolean
  /** Successive getSounds replies; `null` means never reply. */
  replies?: (Sound[] | null)[]
}

function installDom(widget: FakeWidgetOptions) {
  const appended: { remove: () => void }[] = []
  const makeElement = () => {
    const el = {
      style: {} as Record<string, string>,
      setAttribute: () => {},
      remove: vi.fn(),
      onload: null as null | (() => void),
      onerror: null as null | (() => void),
    }
    appended.push(el)
    return el
  }

  let call = 0
  const replies = widget.replies ?? []
  const fakeWidget = {
    bind: (_event: string, listener: () => void) => {
      if (widget.ready !== false) setTimeout(listener, 10)
    },
    unbind: () => {},
    getSounds: (cb: (sounds: Sound[]) => void) => {
      const reply = replies[Math.min(call, replies.length - 1)]
      call++
      if (reply) setTimeout(() => cb(reply), 5)
    },
    load: (_url: string, options: { callback?: () => void }) => {
      setTimeout(() => options.callback?.(), 10)
    },
  }

  const SC = {
    Widget: Object.assign(() => fakeWidget, { Events: { READY: 'ready' } }),
  }

  vi.stubGlobal('window', { SC, setTimeout, clearTimeout })
  vi.stubGlobal('document', {
    createElement: makeElement,
    body: { appendChild: () => {} },
    head: { appendChild: () => {} },
  })

  return { appended }
}

const full = (n: number): Sound[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    title: `Track ${i}`,
    permalink_url: `https://soundcloud.com/deejaybae/t${i}`,
  }))

describe('fetchPlaylists', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('gives up instead of hanging when the widget never becomes ready', async () => {
    installDom({ ready: false })
    const { fetchPlaylists } = await import('./soundcloud')
    const result = fetchPlaylists(['a', 'b'])
    await vi.advanceTimersByTimeAsync(11000)
    await expect(result).resolves.toEqual([[], []])
  })

  it('gives up instead of hanging when getSounds never replies', async () => {
    installDom({ replies: [null] })
    const { fetchPlaylists } = await import('./soundcloud')
    const result = fetchPlaylists(['a'])
    await vi.advanceTimersByTimeAsync(15000)
    await expect(result).resolves.toEqual([[]])
  })

  it('reports tracks as they arrive, then returns the full playlist', async () => {
    // First reply: 2 of 4 tracks have details; later replies: all 4.
    const partial: Sound[] = [...full(2), { id: 2 }, { id: 3 }]
    installDom({ replies: [partial, full(4)] })
    const { fetchPlaylists } = await import('./soundcloud')
    const progress: number[] = []
    const result = fetchPlaylists(['a'], (_i, sounds) => progress.push(sounds.length))
    await vi.advanceTimersByTimeAsync(5000)
    const [first] = await result
    expect(first).toHaveLength(4)
    expect(progress).toEqual([2, 4])
  })

  it('removes its hidden iframe when done', async () => {
    const { appended } = installDom({ replies: [full(1)] })
    const { fetchPlaylists } = await import('./soundcloud')
    const result = fetchPlaylists(['a'])
    await vi.advanceTimersByTimeAsync(2000)
    await result
    expect(appended[0].remove).toHaveBeenCalled()
  })
})

describe('loadSoundCloudApi', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('rejects after a time limit when the script never loads', async () => {
    vi.stubGlobal('window', { setTimeout, clearTimeout })
    vi.stubGlobal('document', {
      createElement: () => ({ style: {} }),
      head: { appendChild: () => {} },
    })
    const { loadSoundCloudApi } = await import('./soundcloud')
    const result = loadSoundCloudApi()
    const assertion = expect(result).rejects.toThrow(/timed out/)
    await vi.advanceTimersByTimeAsync(10500)
    await assertion
  })
})

describe('isBrandCardArtwork', () => {
  it('flags only the white default <dj_b.a.e> card', async () => {
    const { isBrandCardArtwork } = await import('./soundcloud')
    expect(isBrandCardArtwork('https://i1.sndcdn.com/artworks-N0S3aX1KSXvz9Knz-mV9b3Q-t500x500.jpg')).toBe(true)
    // The black Mashups card and real mix artwork keep their own covers.
    expect(isBrandCardArtwork('https://i1.sndcdn.com/artworks-yA01qhtHmkHczBJ2-0TmQCw-t500x500.jpg')).toBe(false)
    expect(isBrandCardArtwork('https://i1.sndcdn.com/artworks-000305096802-u6124s-t500x500.jpg')).toBe(false)
    expect(isBrandCardArtwork(null)).toBe(false)
  })
})
