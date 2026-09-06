import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    webhooks = {
      verify: mocks.verify,
    }
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mocks.from,
  }),
}))

import { POST } from './route'

function requestWith(payload: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://thebaeagenda.com/api/resend/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'svix-id': 'msg_test_123',
      'svix-timestamp': '1788720000',
      'svix-signature': 'v1,test-signature',
      ...headers,
    },
    body: JSON.stringify(payload),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  mocks.verify.mockReset()
  mocks.from.mockReset()
  mocks.upsert.mockReset()

  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubEnv('RESEND_WEBHOOK_SECRET', 'whsec_test')

  mocks.from.mockReturnValue({ upsert: mocks.upsert })
  mocks.upsert.mockResolvedValue({ error: null })
})

describe('Resend delivery webhook', () => {
  it('stores a verified delivery event idempotently', async () => {
    mocks.verify.mockReturnValue({
      type: 'email.delivered',
      created_at: '2026-09-06T17:00:00.000Z',
      data: {
        email_id: 'email_123',
        to: ['client@example.com'],
        subject: 'DJ B.A.E. booking confirmed',
      },
    })

    const response = await POST(requestWith({ ignored: 'raw body is verified by the SDK mock' }))

    expect(response.status).toBe(200)
    expect(mocks.verify).toHaveBeenCalledOnce()
    expect(mocks.from).toHaveBeenCalledWith('email_delivery_events')
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: 'msg_test_123',
        email_id: 'email_123',
        event_type: 'email.delivered',
        recipient: 'client@example.com',
      }),
      {
        onConflict: 'event_id',
        ignoreDuplicates: true,
      }
    )
  })

  it('rejects an invalid signature without writing', async () => {
    mocks.verify.mockImplementation(() => {
      throw new Error('bad signature')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await POST(requestWith({}))

    expect(response.status).toBe(400)
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('fails closed when the webhook secret is missing', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', '')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await POST(requestWith({}))

    expect(response.status).toBe(500)
    expect(mocks.verify).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('ignores non-delivery events after verification', async () => {
    mocks.verify.mockReturnValue({
      type: 'email.opened',
      created_at: '2026-09-06T17:00:00.000Z',
      data: {
        email_id: 'email_123',
        to: ['client@example.com'],
      },
    })

    const response = await POST(requestWith({}))

    expect(response.status).toBe(200)
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
