import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  sendBookingConfirmedNotification,
  sendBookingInquiryReceipt,
  sendBookingNotifications,
  sendEmailNotification,
} from './notifications'

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

  it('passes manual inquiry and confirmation idempotency keys to Resend', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'production')
    vi.stubEnv('EMAIL_DELIVERY_MODE', '')
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('BOOKING_FROM_EMAIL', 'DJ B.A.E. <bookings@example.com>')
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const basePayload = {
      firstName: 'Imani',
      lastName: 'Crumble',
      email: 'client@example.com',
      eventName: 'Birthday Party',
      eventDate: '2026-10-03T23:00:00.000Z',
      eventTimeZone: 'America/Indiana/Indianapolis',
    }

    await sendBookingInquiryReceipt(basePayload, {
      idempotencyKey: 'email-inquiry-receipt-booking-1-attempt-1',
    })
    await sendBookingConfirmedNotification(basePayload, {
      idempotencyKey: 'email-confirmation-booking-1-attempt-2',
    })

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      'Idempotency-Key': 'email-inquiry-receipt-booking-1-attempt-1',
    })
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      'Idempotency-Key': 'email-confirmation-booking-1-attempt-2',
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

const inquiry = {
  bookingId: 'booking-new',
  firstName: 'Imani',
  lastName: 'Crumble',
  email: 'client@example.com',
  phone: '3175551212',
  eventName: 'Birthday Party',
  eventType: 'Birthday',
  eventDate: '2026-10-03T23:00:00.000Z',
  eventTimeZone: 'America/Indiana/Indianapolis',
  venue: 'Venue',
  city: 'Indianapolis, IN',
}

function enableLiveAlerts() {
  vi.stubEnv('NEXT_PUBLIC_DEPLOYMENT_ENV', 'production')
  vi.stubEnv('EMAIL_DELIVERY_MODE', '')
  vi.stubEnv('RESEND_API_KEY', 'test-key')
  vi.stubEnv('BOOKING_FROM_EMAIL', 'DJ B.A.E. <bookings@example.com>')
  vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC_test')
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'twilio-token')
  vi.stubEnv('TWILIO_FROM_NUMBER', '+13175550000')
}

function twilioBodies(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls
    .filter((call) => String(call[0]).includes('api.twilio.com'))
    .map((call) => String(call[1]?.body))
}

function resendSubjects(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls
    .filter((call) => String(call[0]).includes('api.resend.com'))
    .map((call) => JSON.parse(String(call[1]?.body)).subject as string)
}

describe('booking notification alerts', () => {
  it('sends one SMS with the booking id when an email fails and the first SMS did not land', async () => {
    enableLiveAlerts()
    const fetchMock = vi.fn(async (url: string, init?: { body?: string }) => {
      if (String(url).includes('api.resend.com')) {
        const subject = JSON.parse(String(init?.body)).subject as string
        if (subject.startsWith('New booking inquiry')) {
          return new Response('no', { status: 500 })
        }
        return new Response(null, { status: 200 })
      }
      return new Response(null, { status: 500 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const summary = await sendBookingNotifications(inquiry)

    expect(summary.ownerEmailSent).toBe(false)
    expect(summary.clientReceiptSent).toBe(true)
    expect(summary.failures).toEqual(['owner_email', 'owner_sms'])
    const fallbackSms = twilioBodies(fetchMock).filter((body) => body.includes('booking-new'))
    expect(fallbackSms).toHaveLength(1)
    expect(errorSpy.mock.calls.some((call) => String(call[0]).includes('[BOOKING_ALERT_FAILED]'))).toBe(false)
  })

  it('sends a fallback email when the owner SMS fails and the owner email did not land', async () => {
    enableLiveAlerts()
    const fetchMock = vi.fn(async (url: string, init?: { body?: string }) => {
      if (String(url).includes('api.twilio.com')) {
        return new Response('no', { status: 500 })
      }
      const subject = JSON.parse(String(init?.body)).subject as string
      if (subject.startsWith('New booking inquiry')) {
        return new Response('no', { status: 500 })
      }
      return new Response(null, { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const summary = await sendBookingNotifications(inquiry)

    expect(summary.failures).toContain('owner_sms')
    expect(summary.failures).toContain('owner_email')
    expect(resendSubjects(fetchMock)).toContain('Booking alert failed: booking-new')
  })

  it('logs BOOKING_ALERT_FAILED when neither email nor SMS reaches the owner', async () => {
    enableLiveAlerts()
    const fetchMock = vi.fn(async () => new Response('no', { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const summary = await sendBookingNotifications(inquiry)

    expect(summary.failures).toEqual(['owner_email', 'client_receipt', 'owner_sms'])
    expect(twilioBodies(fetchMock).some((body) => body.includes('booking-new'))).toBe(true)
    expect(resendSubjects(fetchMock)).toContain('Booking alert failed: booking-new')
    expect(errorSpy.mock.calls.some((call) => String(call[0]).includes('[BOOKING_ALERT_FAILED] bookingId=booking-new'))).toBe(true)
  })

  it('does not send a second alert when every notification succeeds', async () => {
    enableLiveAlerts()
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const summary = await sendBookingNotifications(inquiry)

    expect(summary.failures).toEqual([])
    expect(summary.ownerEmailSent).toBe(true)
    expect(summary.clientReceiptSent).toBe(true)
    expect(summary.ownerSmsSent).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(errorSpy.mock.calls.some((call) => String(call[0]).includes('[BOOKING_ALERT_FAILED]'))).toBe(false)
  })
})
