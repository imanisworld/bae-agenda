import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  sendBookingPostEventFollowUp: vi.fn(),
  sendBookingReviewRequest: vi.fn(),
  stampBookingEmailSentAt: vi.fn(),
  getPostEventFollowUpPayloadFromBooking: vi.fn(),
  getReviewRequestPayloadFromBooking: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  sendBookingPostEventFollowUp: mocks.sendBookingPostEventFollowUp,
  sendBookingReviewRequest: mocks.sendBookingReviewRequest,
}))

vi.mock('@/lib/booking-email-tracking', () => ({
  stampBookingEmailSentAt: mocks.stampBookingEmailSentAt,
}))

vi.mock('@/lib/booking-email-payloads', () => ({
  getPostEventFollowUpPayloadFromBooking: mocks.getPostEventFollowUpPayloadFromBooking,
  getReviewRequestPayloadFromBooking: mocks.getReviewRequestPayloadFromBooking,
}))

import {
  sendBookingPostEventFollowUpEmail,
  sendBookingReviewRequestEmail,
} from './booking-email-workflows'

function adminWithBooking(booking: Record<string, unknown>) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: booking,
    error: null,
  })
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const insert = vi.fn().mockResolvedValue({ error: null })

  return {
    admin: {
      from: vi.fn((table: string) => {
        if (table === 'bookings') return { select }
        if (table === 'notes') return { insert }
        throw new Error(`Unexpected table: ${table}`)
      }),
    },
    insert,
  }
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()

  mocks.sendBookingPostEventFollowUp.mockResolvedValue({ ok: true })
  mocks.sendBookingReviewRequest.mockResolvedValue({ ok: true })
  mocks.stampBookingEmailSentAt.mockResolvedValue(true)

  mocks.getPostEventFollowUpPayloadFromBooking.mockReturnValue({
    firstName: 'Imani',
    email: 'client@example.com',
    eventName: 'Birthday Party',
    eventDate: '2026-09-28T01:00:00.000Z',
    eventTimeZone: 'America/Indiana/Indianapolis',
  })

  mocks.getReviewRequestPayloadFromBooking.mockReturnValue({
    firstName: 'Imani',
    email: 'client@example.com',
    eventName: 'Birthday Party',
    eventDate: '2026-09-28T01:00:00.000Z',
    eventTimeZone: 'America/Indiana/Indianapolis',
    reviewUrl: 'https://thebaeagenda.com/review',
  })
})

describe('booking email workflows', () => {
  it('preserves a caller-supplied idempotency key for forced post-event resends', async () => {
    const setup = adminWithBooking({
      id: 'booking-1',
      status: 'completed',
      post_event_follow_up_sent_at: '2026-09-28T12:00:00.000Z',
    })

    const result = await sendBookingPostEventFollowUpEmail(
      setup.admin as never,
      'booking-1',
      {
        force: true,
        mode: 'resend',
        idempotencyKey: 'email-post-event-booking-1-attempt-1',
      }
    )

    expect(result).toEqual({
      status: 'sent',
      email: 'client@example.com',
    })
    expect(mocks.sendBookingPostEventFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'client@example.com' }),
      {
        idempotencyKey: 'email-post-event-booking-1-attempt-1',
      }
    )
  })

  it('preserves a caller-supplied idempotency key for forced review resends', async () => {
    const setup = adminWithBooking({
      id: 'booking-1',
      status: 'completed',
      review_request_sent_at: '2026-09-28T12:00:00.000Z',
    })

    const result = await sendBookingReviewRequestEmail(
      setup.admin as never,
      'booking-1',
      {
        force: true,
        mode: 'resend',
        idempotencyKey: 'email-review-request-booking-1-attempt-2',
      }
    )

    expect(result).toEqual({
      status: 'sent',
      email: 'client@example.com',
    })
    expect(mocks.sendBookingReviewRequest).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'client@example.com' }),
      {
        idempotencyKey: 'email-review-request-booking-1-attempt-2',
      }
    )
  })
})
