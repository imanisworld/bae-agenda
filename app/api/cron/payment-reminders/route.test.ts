import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  sendBookingBalanceReminder: vi.fn(),
  sendBookingPostEventFollowUpEmail: vi.fn(),
  sendBookingReviewRequestEmail: vi.fn(),
  getBalanceReminderPayloadFromBooking: vi.fn(),
  getScheduledReminderQueryWindow: vi.fn(),
  isCalendarDaysOut: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/notifications', () => ({
  sendBookingBalanceReminder: mocks.sendBookingBalanceReminder,
}))

vi.mock('@/lib/booking-email-workflows', () => ({
  sendBookingPostEventFollowUpEmail: mocks.sendBookingPostEventFollowUpEmail,
  sendBookingReviewRequestEmail: mocks.sendBookingReviewRequestEmail,
}))

vi.mock('@/lib/booking-email-payloads', () => ({
  getBalanceReminderPayloadFromBooking: mocks.getBalanceReminderPayloadFromBooking,
}))

vi.mock('@/lib/date-time', () => ({
  getScheduledReminderQueryWindow: mocks.getScheduledReminderQueryWindow,
  isCalendarDaysOut: mocks.isCalendarDaysOut,
}))

import { GET } from './route'
import { EVENT_INVOICE_EVENT_TYPE } from '@/lib/event-invoice'

let booking: Record<string, unknown>

function requestWith(secret?: string) {
  return new NextRequest('https://thebaeagenda.com/api/cron/payment-reminders', {
    method: 'GET',
    headers: secret ? { authorization: `Bearer ${secret}` } : undefined,
  })
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset()

  vi.stubEnv('CRON_SECRET', 'cron-secret')
  mocks.getScheduledReminderQueryWindow.mockReturnValue({
    windowStart: new Date('2026-09-21T00:00:00.000Z'),
    windowEnd: new Date('2026-10-05T23:59:59.999Z'),
  })
  mocks.isCalendarDaysOut.mockReturnValue(true)
  mocks.getBalanceReminderPayloadFromBooking.mockReturnValue({
    firstName: 'Imani',
    lastName: 'Crumble',
    email: 'imani@example.com',
    eventName: 'Birthday Party',
    eventDate: '2026-10-05T23:00:00.000Z',
    eventTimeZone: 'America/Indiana/Indianapolis',
    balanceDue: '$800.00',
    payUrl: 'https://thebaeagenda.com/pay/booking-1',
  })
  mocks.sendBookingBalanceReminder.mockResolvedValue({ ok: true })
  mocks.sendBookingPostEventFollowUpEmail.mockResolvedValue({ status: 'skipped' })
  mocks.sendBookingReviewRequestEmail.mockResolvedValue({ status: 'skipped' })

  booking = {
    id: 'booking-1',
    event_name: 'Birthday Party',
    event_date: '2026-10-05T23:00:00.000Z',
    event_timezone: 'America/Indiana/Indianapolis',
    status: 'confirmed',
    quote: 1000,
    venue: 'Venue',
    city: 'Indianapolis, IN',
    post_event_follow_up_sent_at: null,
    review_request_sent_at: null,
    last_balance_reminder_sent_at: null,
    clients: {
      first_name: 'Imani',
      last_name: 'Crumble',
      email: 'imani@example.com',
    },
    payments: [{ amount: 200, status: 'received' }],
  }

  const initialQuery = {
    select: vi.fn(() => ({
      in: vi.fn(() => ({
        lte: vi.fn(() => ({
          gte: vi.fn().mockResolvedValue({
            data: [booking],
            error: null,
          }),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
  }

  mocks.createAdminClient.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'bookings') return initialQuery
      if (table === 'notes') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('payment reminder cron endpoint', () => {
  it('rejects calls without the cron secret', async () => {
    const response = await GET(requestWith())

    expect(response.status).toBe(401)
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('uses a stable idempotency key for scheduled balance reminders', async () => {
    const response = await GET(requestWith('cron-secret'))

    expect(response.status).toBe(200)
    expect(mocks.sendBookingBalanceReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'imani@example.com',
      }),
      {
        idempotencyKey: 'booking-balance-reminder-booking-1',
      }
    )

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      processed: 1,
      balanceSent: 1,
      sent: 1,
    })
  })

  it('sends nothing for venue/promoter bookings made from an event', async () => {
    booking.event_type = EVENT_INVOICE_EVENT_TYPE
    booking.status = 'completed'

    const response = await GET(requestWith('cron-secret'))

    expect(response.status).toBe(200)
    expect(mocks.sendBookingBalanceReminder).not.toHaveBeenCalled()
    expect(mocks.sendBookingPostEventFollowUpEmail).not.toHaveBeenCalled()
    expect(mocks.sendBookingReviewRequestEmail).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({ processed: 1, sent: 0 })
  })
})
