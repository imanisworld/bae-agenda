import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  limitAvailabilityCheck: vi.fn(),
  checkBookingAvailability: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({
  limitAvailabilityCheck: mocks.limitAvailabilityCheck,
}))

vi.mock('@/lib/booking-availability', () => ({
  checkBookingAvailability: mocks.checkBookingAvailability,
}))

import { POST } from './route'

function requestWith(payload: unknown) {
  return new NextRequest('https://thebaeagenda.com/api/booking/check-availability', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(payload),
  })
}

beforeEach(() => {
  mocks.limitAvailabilityCheck.mockReset()
  mocks.checkBookingAvailability.mockReset()
  mocks.limitAvailabilityCheck.mockResolvedValue({
    success: true,
    limit: 30,
    remaining: 29,
    reset: Date.now() + 300_000,
    retryAfter: 0,
  })
})

describe('booking availability endpoint', () => {
  it('returns 429 before database work when the client is rate limited', async () => {
    mocks.limitAvailabilityCheck.mockResolvedValue({
      success: false,
      limit: 30,
      remaining: 0,
      reset: Date.now() + 60_000,
      retryAfter: 60,
    })

    const response = await POST(requestWith({
      eventDate: '2026-10-03',
      timeZone: 'America/Indiana/Indianapolis',
    }))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('60')
    expect(mocks.checkBookingAvailability).not.toHaveBeenCalled()
  })

  it('rejects invalid input without querying availability', async () => {
    const response = await POST(requestWith({
      eventDate: '10/03/2026',
      timeZone: '',
    }))

    expect(response.status).toBe(400)
    expect(mocks.checkBookingAvailability).not.toHaveBeenCalled()
  })

  it('returns the availability result for a valid request', async () => {
    mocks.checkBookingAvailability.mockResolvedValue({
      ok: true,
      available: true,
      conflicts: [],
    })

    const response = await POST(requestWith({
      eventDate: '2026-10-03',
      eventTime: '19:00',
      eventEndTime: '23:00',
      timeZone: 'America/Indiana/Indianapolis',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      available: true,
      conflicts: [],
    })
    expect(mocks.checkBookingAvailability).toHaveBeenCalledWith({
      eventDate: '2026-10-03',
      eventTime: '19:00',
      eventEndTime: '23:00',
      timeZone: 'America/Indiana/Indianapolis',
    })
  })
})
