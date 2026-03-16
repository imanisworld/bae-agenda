type BookingNotificationPayload = {
  firstName: string
  lastName?: string | null
  email: string
  phone?: string | null
  eventName: string
  eventType?: string | null
  eventDate: string
  eventTimeZone: string
  venue?: string | null
  city?: string | null
  packageName?: string | null
  notes?: string | null
}

const OWNER_ALERT_EMAIL = process.env.BOOKING_ALERT_EMAIL ?? 'baebookings@proton.me'
const OWNER_ALERT_PHONE = normalizeUsPhone(process.env.BOOKING_ALERT_PHONE ?? '7087522820')

type NotificationResult =
  | { ok: true }
  | { ok: false; reason: 'missing_config' | 'request_failed'; detail?: string }

function normalizeUsPhone(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function formatEventDateTime(eventDate: string, timeZone: string) {
  const date = new Date(eventDate)

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(date)
}

function buildBookingSummaryLines(payload: BookingNotificationPayload) {
  return [
    `Name: ${[payload.firstName, payload.lastName].filter(Boolean).join(' ')}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone || 'Not provided'}`,
    `Event: ${payload.eventName}`,
    `Type: ${payload.eventType || 'Not provided'}`,
    `Date: ${formatEventDateTime(payload.eventDate, payload.eventTimeZone)}`,
    `Time Zone: ${payload.eventTimeZone}`,
    `Venue: ${payload.venue || 'Not provided'}`,
    `City: ${payload.city || 'Not provided'}`,
    `Package: ${payload.packageName || 'Not provided'}`,
    `Notes: ${payload.notes || 'Not provided'}`,
  ]
}

async function sendEmail(args: {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
}): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.BOOKING_FROM_EMAIL

  if (!apiKey || !from) {
    return { ok: false, reason: 'missing_config', detail: 'Missing Resend config.' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        text: args.text,
        html: args.html,
        reply_to: args.replyTo,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      return { ok: false, reason: 'request_failed', detail }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: 'request_failed',
      detail: error instanceof Error ? error.message : 'Unknown email error.',
    }
  }
}

async function sendSms(to: string, body: string): Promise<NotificationResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    return { ok: false, reason: 'missing_config', detail: 'Missing Twilio config.' }
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: body,
      }).toString(),
    })

    if (!response.ok) {
      const detail = await response.text()
      return { ok: false, reason: 'request_failed', detail }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: 'request_failed',
      detail: error instanceof Error ? error.message : 'Unknown SMS error.',
    }
  }
}

export async function sendBookingNotifications(payload: BookingNotificationPayload) {
  const ownerSummary = buildBookingSummaryLines(payload).join('\n')
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ')

  const tasks: Array<Promise<NotificationResult>> = [
    sendEmail({
      to: OWNER_ALERT_EMAIL,
      subject: `New booking inquiry: ${payload.eventName}`,
      replyTo: payload.email,
      text: `A new booking inquiry was submitted.\n\n${ownerSummary}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2 style="margin: 0 0 16px;">New booking inquiry</h2>
          <p style="margin: 0 0 16px;">A new inquiry was submitted through the site.</p>
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; background: #f6f4ef; padding: 16px; border: 1px solid #ddd;">${ownerSummary}</pre>
        </div>
      `,
    }),
    sendEmail({
      to: payload.email,
      subject: `We received your booking inquiry for ${payload.eventName}`,
      text: [
        `Hi ${payload.firstName},`,
        '',
        'Thanks for reaching out. Your booking inquiry came through successfully.',
        '',
        `Event: ${payload.eventName}`,
        `Date: ${eventDateTime}`,
        `Time Zone: ${payload.eventTimeZone}`,
        '',
        'We will follow up soon.',
        '',
        'DJ B.A.E. Bookings',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <p>Hi ${payload.firstName},</p>
          <p>Thanks for reaching out. Your booking inquiry came through successfully.</p>
          <p>
            <strong>Event:</strong> ${payload.eventName}<br />
            <strong>Date:</strong> ${eventDateTime}<br />
            <strong>Time Zone:</strong> ${payload.eventTimeZone}
          </p>
          <p>We will follow up soon.</p>
          <p>DJ B.A.E. Bookings</p>
        </div>
      `,
    }),
  ]

  if (OWNER_ALERT_PHONE) {
    tasks.push(
      sendSms(
        OWNER_ALERT_PHONE,
        `New inquiry from ${guestName || payload.firstName} for ${payload.eventName} on ${eventDateTime}.`
      )
    )
  }

  const results = await Promise.allSettled(tasks)

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[booking-notification:${index}]`, result.reason)
      return
    }

    if (!result.value.ok) {
      console.error(`[booking-notification:${index}]`, result.value.reason, result.value.detail ?? '')
    }
  })
}
