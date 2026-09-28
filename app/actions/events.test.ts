import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/admin-auth', () => ({ requireAdminUser: mocks.requireAdminUser }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))

import { deleteEventAction } from './events'

class RedirectSignal extends Error {
  constructor(public url: string) { super(url) }
}

function form() {
  const data = new FormData()
  data.set('id', 'event-1')
  return data
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()
  mocks.requireAdminUser.mockResolvedValue({ id: 'admin-1' })
  mocks.redirect.mockImplementation((url: string) => {
    throw new RedirectSignal(url)
  })
})

describe('event deletion', () => {
  it('requires admin auth, deletes the event, then removes stored event media files', async () => {
    const mediaEq = vi.fn().mockResolvedValue({
      data: [
        { storage_path: 'events/event-1/photo.jpg' },
        { storage_path: null },
        { storage_path: 'events/event-1/video.mp4' },
      ],
      error: null,
    })
    const mediaSelect = vi.fn(() => ({ eq: mediaEq }))

    const eventDeleteEq = vi.fn().mockResolvedValue({ error: null })
    const eventDelete = vi.fn(() => ({ eq: eventDeleteEq }))

    const remove = vi.fn().mockResolvedValue({ data: [], error: null })
    const storageFrom = vi.fn(() => ({ remove }))

    const admin = {
      from: vi.fn((table: string) => {
        if (table === 'event_media') return { select: mediaSelect }
        if (table === 'events') return { delete: eventDelete }
        throw new Error(`Unexpected table: ${table}`)
      }),
      storage: { from: storageFrom },
    }
    mocks.createAdminClient.mockReturnValue(admin)

    await expect(deleteEventAction(form())).rejects.toMatchObject({
      url: '/admin/events',
    })

    expect(mocks.requireAdminUser).toHaveBeenCalledOnce()
    expect(eventDeleteEq).toHaveBeenCalledWith('id', 'event-1')
    expect(remove).toHaveBeenCalledWith([
      'events/event-1/photo.jpg',
      'events/event-1/video.mp4',
    ])
  })

  it('does not remove storage files when the database delete fails', async () => {
    const mediaEq = vi.fn().mockResolvedValue({
      data: [{ storage_path: 'events/event-1/photo.jpg' }],
      error: null,
    })
    const mediaSelect = vi.fn(() => ({ eq: mediaEq }))

    const eventDeleteEq = vi.fn().mockResolvedValue({
      error: { message: 'delete failed' },
    })
    const eventDelete = vi.fn(() => ({ eq: eventDeleteEq }))
    const remove = vi.fn()

    mocks.createAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'event_media') return { select: mediaSelect }
        if (table === 'events') return { delete: eventDelete }
        throw new Error(`Unexpected table: ${table}`)
      }),
      storage: { from: vi.fn(() => ({ remove })) },
    })

    await expect(deleteEventAction(form())).rejects.toBeInstanceOf(RedirectSignal)
    expect(remove).not.toHaveBeenCalled()
  })
})
