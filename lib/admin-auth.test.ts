import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { isAllowedAdminUser } from './admin-auth'

describe('admin auth allowlist', () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS

  beforeEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails
  })

  it('denies users without an email', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'

    expect(isAllowedAdminUser(null)).toBe(false)
    expect(isAllowedAdminUser({ email: undefined })).toBe(false)
  })

  it('allows any signed-in user when the allowlist is empty', () => {
    process.env.ADMIN_EMAILS = ''

    expect(isAllowedAdminUser({ email: 'anyone@example.com' })).toBe(true)
  })

  it('matches allowlisted emails case-insensitively', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com, owner@example.com'

    expect(isAllowedAdminUser({ email: 'OWNER@example.com' })).toBe(true)
    expect(isAllowedAdminUser({ email: 'other@example.com' })).toBe(false)
  })
})
