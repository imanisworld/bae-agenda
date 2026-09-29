import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'

const URL_BASE = 'https://thebaeagenda.com/api/instagram/webhook'

function sign(body: string, secret = 'app_secret_test') {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
}

function post(body: string, signature: string | null) {
  return new NextRequest(URL_BASE, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(signature ? { 'x-hub-signature-256': signature } : {}),
    },
    body,
  })
}

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.stubEnv('INSTAGRAM_WEBHOOK_VERIFY_TOKEN', 'verify_test')
  vi.stubEnv('INSTAGRAM_APP_SECRET', 'app_secret_test')
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('Instagram webhook verification', () => {
  it('echoes the challenge when the verify token matches', async () => {
    const response = await GET(new NextRequest(
      `${URL_BASE}?hub.mode=subscribe&hub.verify_token=verify_test&hub.challenge=12345`,
    ))

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('12345')
  })

  it('rejects a wrong verify token', async () => {
    const response = await GET(new NextRequest(
      `${URL_BASE}?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=12345`,
    ))

    expect(response.status).toBe(403)
  })

  it('fails closed when the verify token is not configured', async () => {
    vi.stubEnv('INSTAGRAM_WEBHOOK_VERIFY_TOKEN', '')
    const response = await GET(new NextRequest(
      `${URL_BASE}?hub.mode=subscribe&hub.verify_token=&hub.challenge=12345`,
    ))

    expect(response.status).toBe(500)
  })
})

describe('Instagram webhook events', () => {
  const body = JSON.stringify({
    object: 'instagram',
    entry: [{ id: '1789', time: 1788720000, changes: [{ field: 'comments' }] }],
  })

  it('accepts a correctly signed event', async () => {
    const response = await POST(post(body, sign(body)))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
  })

  it('rejects an event signed with the wrong secret', async () => {
    const response = await POST(post(body, sign(body, 'someone_else')))

    expect(response.status).toBe(400)
  })

  it('rejects an unsigned event', async () => {
    const response = await POST(post(body, null))

    expect(response.status).toBe(400)
  })
})
