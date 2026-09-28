import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  limitBookingSubmission: vi.fn(),
  checkBookingAvailability: vi.fn(),
  createAdminClient: vi.fn(),
  sendBookingNotifications: vi.fn(),
  stampBookingEmailSentAt: vi.fn(),
}))

vi.mock('@/lib/ratelimit', () => ({
  limitBookingSubmission: mocks.limitBookingSubmission,
}))

vi.mock('@/lib/booking-availability', () => ({
  checkBookingAvailability: mocks.checkBookingAvailability,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/notifications', () => ({
  sendBookingNotifications: mocks.sendBookingNotifications,
}))

vi.mock('@/lib/booking-email-tracking', () => ({
  stampBookingEmailSentAt: mocks.stampBookingEmailSentAt,
}))

import { POST } from './route'

const validBody = {
  firstName: 'Imani',
  lastName: 'Crumble',
  email: 'imani@example.com',
  phone: '3175551212',
  eventName: 'Birthday Party',
  eventType: 'Birthday',
  eventDate: '2026-10-03',
  eventTime: '19:00',
  eventEndTime: '23:00',
  timeZone: 'America/Indiana/Indianapolis',
  venue: 'Venue',
  city: 'Indianapolis, IN',
  package: 'The Agenda',
  notes: 'Test request',
  acceptedTerms: true,
  website: '',
  startedAt: '1791043200000',
}

function requestWith(payload: unknown) {
  return new NextRequest('https://thebaeagenda.com/api/booking', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://thebaeagenda.com',
      host: 'thebaeagenda.com',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(payload),
  })
}

function adminForBooking(args: {
  bookingResult: { data: { id: string } | null; error: { code?: string; message?: string } | null }
  existingBookingId?: string | null
}) {
  const clientSingle = vi.fn().mockResolvedValue({
    data: { id: 'client-1' },
    error: null,
  })
  const clientSelect = vi.fn(() => ({ single: clientSingle }))
  const clientUpsert = vi.fn(() => ({ select: clientSelect }))

  const bookingSingle = vi.fn().mockResolvedValue(args.bookingResult)
  const bookingSelectAfterInsert = vi.fn(() => ({ single: bookingSingle }))
  const bookingInsert = vi.fn(() => ({ select: bookingSelectAfterInsert }))

  const existingMaybeSingle = vi.fn().mockResolvedValue({
    data: args.existingBookingId ? { id: args.existingBookingId } : null,
    error: null,
  })
  const existingEq = vi.fn(() => ({ maybeSingle: existingMaybeSingle }))
  const existingSelect = vi.fn(() => ({ eq: existingEq }))

  let bookingFromCalls = 0
  const from = vi.fn((table: string) => {
    if (table === 'clients') {
      return { upsert: clientUpsert }
    }

    if (table === 'bookings') {
      bookingFromCalls += 1
      if (bookingFromCalls === 1) {
        return { insert: bookingInsert }
      }
      return { select: existingSelect }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    admin: { from },
    bookingInsert,
  }
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()

  mocks.limitBookingSubmission.mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Date.now() + 600_000,
    retryAfter: 0,
  })
  mocks.checkBookingAvailability.mockResolvedValue({
    ok: true,
    available: true,
    conflicts: [],
  })
  mocks.sendBookingNotifications.mockResolvedValue({
    clientReceiptSent: true,
  })
  mocks.stampBookingEmailSentAt.mockResolvedValue(true)
})

describe('booking endpoint', () => {
  it('returns 429 before validation or database work when rate limited', async () => {
    mocks.limitBookingSubmission.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60_000,
      retryAfter: 60,
    })

    const response = await POST(requestWith(validBody))

    expect(response.status).toBe(429)
    expect(mocks.checkBookingAvailability).not.toHaveBeenCalled()
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('rejects a booking that does not accept the booking terms', async () => {
    const response = await POST(requestWith({
      ...validBody,
      acceptedTerms: false,
    }))

    expect(response.status).toBe(400)
    expect(mocks.checkBookingAvailability).not.toHaveBeenCalled()
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('treats a repeated submission as success without sending duplicate notifications', async () => {
    const setup = adminForBooking({
      bookingResult: {
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      },
      existingBookingId: 'booking-existing',
    })
    mocks.createAdminClient.mockReturnValue(setup.admin)

    const response = await POST(requestWith(validBody))

    expect(response.status).toBe(200)
    expect(mocks.sendBookingNotifications).not.toHaveBeenCalled()
    expect(mocks.stampBookingEmailSentAt).not.toHaveBeenCalled()
    expect(setup.bookingInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        submission_key: expect.stringMatching(/^[a-f0-9]{64}$/),
      })
    )
  })

  it('sends notifications once for a newly created booking', async () => {
    const setup = adminForBooking({
      bookingResult: {
        data: { id: 'booking-new' },
        error: null,
      },
    })
    mocks.createAdminClient.mockReturnValue(setup.admin)

    const response = await POST(requestWith(validBody))

    expect(response.status).toBe(201)
    expect(mocks.sendBookingNotifications).toHaveBeenCalledOnce()
    expect(mocks.stampBookingEmailSentAt).toHaveBeenCalledWith(
      setup.admin,
      'booking-new',
      'inquiry_receipt_sent_at'
    )
  })
})
