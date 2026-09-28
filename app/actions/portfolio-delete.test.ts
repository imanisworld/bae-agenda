import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/admin-auth', () => ({ requireAdminUser: mocks.requireAdminUser }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))

import { deletePortfolioEntryAction } from './portfolio'

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

describe('portfolio deletion', () => {
  it('requires admin auth and deletes only the requested portfolio entry', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn(() => ({ eq }))
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => ({ delete: del })),
    })

    const form = new FormData()
    form.set('id', 'portfolio-1')

    await expect(deletePortfolioEntryAction(form)).rejects.toMatchObject({
      url: '/admin/portfolio',
    })

    expect(mocks.requireAdminUser).toHaveBeenCalledOnce()
    expect(eq).toHaveBeenCalledWith('id', 'portfolio-1')
  })
})
