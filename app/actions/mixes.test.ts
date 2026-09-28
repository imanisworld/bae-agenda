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

import { deleteMixAction } from './mixes'

class RedirectSignal extends Error {
  constructor(public url: string) { super(url) }
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()
  mocks.requireAdminUser.mockResolvedValue({ id: 'admin-1' })
  mocks.redirect.mockImplementation((url: string) => {
    throw new RedirectSignal(url)
  })
})

describe('mix deletion', () => {
  it('requires admin auth and deletes only the requested mix', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn(() => ({ eq }))
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => ({ delete: del })),
    })

    const form = new FormData()
    form.set('id', 'mix-1')

    await expect(deleteMixAction(form)).rejects.toMatchObject({
      url: '/admin/mixes',
    })

    expect(mocks.requireAdminUser).toHaveBeenCalledOnce()
    expect(eq).toHaveBeenCalledWith('id', 'mix-1')
  })
})
