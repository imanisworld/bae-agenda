import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  cookies: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}))

import {
  formatPortalPhone,
  normalizePortalPhone,
  verifyPortalCode,
} from './portal-auth'

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function buildPortalAdmin(args: {
  code: string
  expiresAt: string
  consumeResult?: { id: string } | null
  client?: {
    id: string
    first_name: string
    last_name: string | null
    email: string
    phone: string | null
  } | null
}) {
  const client = args.client === undefined
    ? {
        id: 'client-1',
        first_name: 'Imani',
        last_name: 'Crumble',
        email: 'imani@example.com',
        phone: '+13175551212',
      }
    : args.client

  const clientMaybeSingle = vi.fn().mockResolvedValue({
    data: client,
    error: null,
  })
  const clientEq = vi.fn(() => ({ maybeSingle: clientMaybeSingle }))
  const clientSelect = vi.fn(() => ({ eq: clientEq }))

  const codeMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'code-1',
      code_hash: hash(args.code),
      expires_at: args.expiresAt,
      consumed_at: null,
    },
    error: null,
  })
  const codeLimit = vi.fn(() => ({ maybeSingle: codeMaybeSingle }))
  const codeOrder = vi.fn(() => ({ limit: codeLimit }))
  const codeIs = vi.fn(() => ({ order: codeOrder }))
  const codeEqPhone = vi.fn(() => ({ is: codeIs }))
  const codeEqClient = vi.fn(() => ({ eq: codeEqPhone }))
  const codeSelect = vi.fn(() => ({ eq: codeEqClient }))

  const consumeMaybeSingle = vi.fn().mockResolvedValue({
    data: args.consumeResult === undefined ? { id: 'code-1' } : args.consumeResult,
    error: null,
  })
  const consumeSelect = vi.fn(() => ({ maybeSingle: consumeMaybeSingle }))
  const consumeIs = vi.fn(() => ({ select: consumeSelect }))
  const consumeEq = vi.fn(() => ({ is: consumeIs }))
  const codeUpdate = vi.fn(() => ({ eq: consumeEq }))

  const sessionInsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table === 'clients') {
      return { select: clientSelect }
    }

    if (table === 'client_portal_codes') {
      return {
        select: codeSelect,
        update: codeUpdate,
      }
    }

    if (table === 'client_portal_sessions') {
      return { insert: sessionInsert }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    admin: { from },
    codeUpdate,
    sessionInsert,
  }
}

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-28T18:00:00.000Z'))
  vi.stubEnv('NODE_ENV', 'production')

  for (const mock of Object.values(mocks)) mock.mockReset()
  cookieStore.get.mockReset()
  cookieStore.set.mockReset()
  cookieStore.delete.mockReset()
  mocks.cookies.mockResolvedValue(cookieStore)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('portal authentication helpers', () => {
  it('normalizes and formats supported US phone numbers', () => {
    expect(normalizePortalPhone('(317) 555-1212')).toBe('+13175551212')
    expect(normalizePortalPhone('1-317-555-1212')).toBe('+13175551212')
    expect(normalizePortalPhone('555-1212')).toBeNull()
    expect(formatPortalPhone('+13175551212')).toBe('(317) 555-1212')
  })

  it('creates a session only after atomically claiming the unconsumed code', async () => {
    const setup = buildPortalAdmin({
      code: '123456',
      expiresAt: '2026-09-28T18:10:00.000Z',
    })
    mocks.createAdminClient.mockReturnValue(setup.admin)

    const client = await verifyPortalCode('+13175551212', '123456')

    expect(client).toMatchObject({
      id: 'client-1',
      email: 'imani@example.com',
    })
    expect(setup.codeUpdate).toHaveBeenCalledWith({
      consumed_at: '2026-09-28T18:00:00.000Z',
    })
    expect(setup.sessionInsert).toHaveBeenCalledOnce()
    expect(cookieStore.set).toHaveBeenCalledWith(
      'bae_portal_session',
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      })
    )
  })

  it('does not create a second session if another request consumed the code first', async () => {
    const setup = buildPortalAdmin({
      code: '123456',
      expiresAt: '2026-09-28T18:10:00.000Z',
      consumeResult: null,
    })
    mocks.createAdminClient.mockReturnValue(setup.admin)

    await expect(
      verifyPortalCode('+13175551212', '123456')
    ).resolves.toBeNull()

    expect(setup.sessionInsert).not.toHaveBeenCalled()
    expect(cookieStore.set).not.toHaveBeenCalled()
  })

  it('rejects an expired code without consuming it', async () => {
    const setup = buildPortalAdmin({
      code: '123456',
      expiresAt: '2026-09-28T17:59:59.000Z',
    })
    mocks.createAdminClient.mockReturnValue(setup.admin)

    await expect(
      verifyPortalCode('+13175551212', '123456')
    ).resolves.toBeNull()

    expect(setup.codeUpdate).not.toHaveBeenCalled()
    expect(setup.sessionInsert).not.toHaveBeenCalled()
  })

  it('rejects an incorrect code without consuming it', async () => {
    const setup = buildPortalAdmin({
      code: '123456',
      expiresAt: '2026-09-28T18:10:00.000Z',
    })
    mocks.createAdminClient.mockReturnValue(setup.admin)

    await expect(
      verifyPortalCode('+13175551212', '654321')
    ).resolves.toBeNull()

    expect(setup.codeUpdate).not.toHaveBeenCalled()
    expect(setup.sessionInsert).not.toHaveBeenCalled()
  })
})
