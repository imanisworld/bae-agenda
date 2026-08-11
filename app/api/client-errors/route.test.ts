import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

function requestWith(payload: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://staging.example.com/api/client-errors', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://staging.example.com',
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
    body: JSON.stringify(payload),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('client error reporting endpoint', () => {
  it('logs a bounded same-origin homepage report', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await POST(requestWith({
      source: 'homepage-section',
      section: 'hero',
      environment: 'staging',
      pathname: '/',
      name: 'TypeError',
      message: 'Hydration failed',
    }))

    expect(response.status).toBe(204)
    expect(log).toHaveBeenCalledOnce()
    expect(log.mock.calls[0]?.[0]).toContain('client_render_error')
  })

  it('rejects cross-origin reports', async () => {
    const response = await POST(requestWith({}, {
      origin: 'https://attacker.example',
      'sec-fetch-site': 'cross-site',
    }))

    expect(response.status).toBe(403)
  })

  it('rejects oversized reports', async () => {
    const response = await POST(requestWith({
      source: 'global',
      environment: 'staging',
      message: 'x'.repeat(13_000),
    }))

    expect(response.status).toBe(413)
  })
})
