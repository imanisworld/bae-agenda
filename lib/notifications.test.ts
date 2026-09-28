import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendEmailNotification } from './notifications'

const message = {
  to: 'real-client@example.com',
  subject: 'Booking confirmed',
  text: 'Your booking is confirmed.',
  html: '<p>Your booking is confirmed.</p>',
  replyTo: 'real-client@example.com',
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('email notification transport', () => {
  it('does not call Resend when preview delivery is disabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'preview')
    vi.stubEnv('EMAIL_DELIVERY_MODE', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(sendEmailNotification(message)).resolves.toMatchObject({
      ok: false,
      reason: 'delivery_disabled',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('redirects staging mail before calling Resend', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'staging')
    vi.stubEnv('EMAIL_DELIVERY_MODE', 'redirect')
    vi.stubEnv('EMAIL_REDIRECT_TO', 'staging-inbox@example.com')
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('BOOKING_FROM_EMAIL', 'DJ B.A.E. <bookings@example.com>')
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(sendEmailNotification(message)).resolves.toEqual({ ok: true })

    const request = fetchMock.mock.calls[0]
    expect(request?.[0]).toBe('https://api.resend.com/emails')
    const body = JSON.parse(String(request?.[1]?.body))
    expect(body.to).toEqual(['staging-inbox@example.com'])
    expect(body.subject).toBe('[STAGING for real-client@example.com] Booking confirmed')
    expect(body.reply_to).toBeUndefined()
  })

  it('passes an idempotency key through to Resend', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'production')
    vi.stubEnv('EMAIL_DELIVERY_MODE', '')
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('BOOKING_FROM_EMAIL', 'DJ B.A.E. <bookings@example.com>')
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(sendEmailNotification({
      ...message,
      idempotencyKey: 'invoice-invoice-booking-1-attempt-1',
    })).resolves.toEqual({ ok: true })

    const request = fetchMock.mock.calls[0]
    expect(request?.[1]?.headers).toMatchObject({
      'Idempotency-Key': 'invoice-invoice-booking-1-attempt-1',
    })
  })

  it('keeps the original recipient in production', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'production')
    vi.stubEnv('EMAIL_DELIVERY_MODE', '')
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('BOOKING_FROM_EMAIL', 'DJ B.A.E. <bookings@example.com>')
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(sendEmailNotification(message)).resolves.toEqual({ ok: true })

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(body.to).toEqual(['real-client@example.com'])
    expect(body.subject).toBe('Booking confirmed')
    expect(body.reply_to).toBe('real-client@example.com')
  })
})
