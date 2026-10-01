import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }) }))

describe('neighbourRoute', () => {
  it('follows the dock order: swipe left for the next page, right for the previous', async () => {
    const { neighbourRoute } = await import('./useRouteGestures')
    expect(neighbourRoute('/', -120)).toEqual({ route: '/events', direction: 'next' })
    expect(neighbourRoute('/lab', -120)).toEqual({ route: '/portfolio', direction: 'next' })
    expect(neighbourRoute('/lab', 120)).toEqual({ route: '/events', direction: 'prev' })
    expect(neighbourRoute('/book', 120)).toEqual({ route: '/meet', direction: 'prev' })
  })

  it('stops at the ends and ignores pages outside the dock', async () => {
    const { neighbourRoute } = await import('./useRouteGestures')
    expect(neighbourRoute('/', 120)).toBeNull()
    expect(neighbourRoute('/book', -120)).toBeNull()
    expect(neighbourRoute('/press-kit', -120)).toBeNull()
    expect(neighbourRoute('/lab', 0)).toBeNull()
  })
})
