import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveEmailDelivery } from './email-delivery'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('email delivery policy', () => {
  it('keeps production delivery live by default', () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'production')
    vi.stubEnv('EMAIL_DELIVERY_MODE', '')

    expect(resolveEmailDelivery({
      to: 'client@example.com',
      subject: 'Booking confirmed',
      replyTo: 'reply@example.com',
    })).toEqual({
      enabled: true,
      environment: 'production',
      mode: 'live',
      to: 'client@example.com',
      subject: 'Booking confirmed',
      replyTo: 'reply@example.com',
    })
  })

  it('disables preview delivery by default', () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'preview')
    vi.stubEnv('EMAIL_DELIVERY_MODE', '')

    expect(resolveEmailDelivery({ to: 'client@example.com', subject: 'Invoice' })).toEqual({
      enabled: false,
      environment: 'preview',
      mode: 'disabled',
    })
  })

  it('redirects staging mail and removes the real-client reply-to', () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'staging')
    vi.stubEnv('EMAIL_DELIVERY_MODE', 'redirect')
    vi.stubEnv('EMAIL_REDIRECT_TO', 'staging-inbox@example.com')

    expect(resolveEmailDelivery({
      to: 'real-client@example.com',
      subject: 'Final payment reminder',
      replyTo: 'real-client@example.com',
    })).toEqual({
      enabled: true,
      environment: 'staging',
      mode: 'redirect',
      to: 'staging-inbox@example.com',
      subject: '[STAGING for real-client@example.com] Final payment reminder',
      replyTo: undefined,
    })
  })

  it('fails closed when redirect mode has no redirect inbox', () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'staging')
    vi.stubEnv('EMAIL_DELIVERY_MODE', 'redirect')
    vi.stubEnv('EMAIL_REDIRECT_TO', '')

    expect(resolveEmailDelivery({ to: 'client@example.com', subject: 'Invoice' }).enabled).toBe(false)
  })
})
