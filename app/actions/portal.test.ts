import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  redirect: vi.fn(),
  limitPortalSendCode: vi.fn(),
  findPortalClientByPhone: vi.fn(),
  issuePortalCode: vi.fn(),
  sendClientPortalCodeSms: vi.fn(),
  normalizePortalPhone: vi.fn(),
  formatPortalPhone: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: mocks.headers,
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}))

vi.mock('@/lib/ratelimit', () => ({
  limitPortalRequest: vi.fn(),
  limitPortalSendCode: mocks.limitPortalSendCode,
  limitPortalVerifyCode: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  sendClientPortalCodeSms: mocks.sendClientPortalCodeSms,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/portal-auth', () => ({
  findPortalClientByPhone: mocks.findPortalClientByPhone,
  formatPortalPhone: mocks.formatPortalPhone,
  getPortalSessionClient: vi.fn(),
  issuePortalCode: mocks.issuePortalCode,
  normalizePortalPhone: mocks.normalizePortalPhone,
  revokePortalSession: vi.fn(),
  verifyPortalCode: vi.fn(),
}))

import { sendPortalCodeAction } from './portal'

class RedirectSignal extends Error {
  constructor(public url: string) {
    super(url)
  }
}

function phoneForm(value = '(317) 555-1212') {
  const form = new FormData()
  form.set('phone', value)
  return form
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()

  mocks.headers.mockResolvedValue(new Headers({ 'x-forwarded-for': '203.0.113.10' }))
  mocks.normalizePortalPhone.mockReturnValue('+13175551212')
  mocks.formatPortalPhone.mockReturnValue('(317) 555-1212')
  mocks.limitPortalSendCode.mockResolvedValue({
    success: true,
    ip: '203.0.113.10',
    limit: 5,
    remaining: 4,
    reset: Date.now() + 600_000,
    retryAfter: 0,
  })
  mocks.issuePortalCode.mockResolvedValue('123456')
  mocks.sendClientPortalCodeSms.mockResolvedValue({ ok: true })
  mocks.redirect.mockImplementation((url: string) => {
    throw new RedirectSignal(url)
  })
})

describe('portal code request action', () => {
  it('stops before client lookup or SMS when the request is rate limited', async () => {
    mocks.limitPortalSendCode.mockResolvedValue({
      success: false,
      ip: '203.0.113.10',
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60_000,
      retryAfter: 60,
    })

    await expect(sendPortalCodeAction(phoneForm())).rejects.toMatchObject({
      url: expect.stringContaining('/portal/login?error='),
    })

    expect(mocks.findPortalClientByPhone).not.toHaveBeenCalled()
    expect(mocks.issuePortalCode).not.toHaveBeenCalled()
    expect(mocks.sendClientPortalCodeSms).not.toHaveBeenCalled()
  })

  it('does not reveal whether an unknown phone number belongs to a client', async () => {
    mocks.findPortalClientByPhone.mockResolvedValue(null)

    await expect(sendPortalCodeAction(phoneForm())).rejects.toMatchObject({
      url: expect.stringContaining('/portal/verify?'),
    })

    expect(mocks.issuePortalCode).not.toHaveBeenCalled()
    expect(mocks.sendClientPortalCodeSms).not.toHaveBeenCalled()
  })

  it('issues and sends one code for a known client after rate limiting passes', async () => {
    mocks.findPortalClientByPhone.mockResolvedValue({ id: 'client-1' })

    await expect(sendPortalCodeAction(phoneForm())).rejects.toMatchObject({
      url: expect.stringContaining('/portal/verify?'),
    })

    expect(mocks.limitPortalSendCode).toHaveBeenCalledWith(
      expect.any(Headers),
      '+13175551212'
    )
    expect(mocks.issuePortalCode).toHaveBeenCalledWith(
      'client-1',
      '+13175551212',
      '203.0.113.10'
    )
    expect(mocks.sendClientPortalCodeSms).toHaveBeenCalledWith(
      '+13175551212',
      '123456'
    )
  })
})
