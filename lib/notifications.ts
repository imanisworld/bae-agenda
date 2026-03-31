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

type BookingConfirmedNotificationPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventDate: string
  eventTimeZone: string
  venue?: string | null
  city?: string | null
}

type BookingInquiryReceiptPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventDate: string
  eventTimeZone: string
}

type BookingDepositReminderPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventDate: string
  eventTimeZone: string
  depositDue: string
  payUrl: string
}

type BookingBalanceReminderPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventDate: string
  eventTimeZone: string
  balanceDue: string
}

type BookingEventReminderPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventDate: string
  eventTimeZone: string
  venue?: string | null
  city?: string | null
}

type InvoiceNotificationPayload = {
  to: string
  clientName: string
  eventName: string
  invoiceNumber: string
  balanceDue: string
  pdfBase64: string
  pdfFilename: string
}

type W9NotificationPayload = {
  to: string
  clientName: string
  eventName: string
  paymentAmount: string
  pdfBase64: string
  pdfFilename: string
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderField(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 18px;">
        <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px;">
          ${escapeHtml(label)}
        </div>
        <div style="font-size:16px;color:#ffffff;">
          ${escapeHtml(value)}
        </div>
      </td>
    </tr>
  `
}

function buildOwnerBookingEmailHtml(payload: BookingNotificationPayload, eventDateTime: string) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ') || payload.firstName
  const fields = [
    ['Guest', guestName],
    ['Email', payload.email],
    ['Phone', payload.phone || 'Not provided'],
    ['Event', payload.eventName],
    ['Type', payload.eventType || 'Not provided'],
    ['Date', eventDateTime],
    ['Time Zone', payload.eventTimeZone],
    ['Venue', payload.venue || 'Not provided'],
    ['City', payload.city || 'Not provided'],
    ['Package', payload.packageName || 'Not provided'],
    ['Notes', payload.notes || 'Not provided'],
  ] as const

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" lang="en">
      <head>
        <meta content="width=device-width" name="viewport" />
        <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
        <meta content="IE=edge" http-equiv="X-UA-Compatible" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
        <title>The Bae Agenda</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0b0b10;">
        <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center" style="background-color:#0b0b10;margin:0;padding:24px 0;width:100%;">
          <tbody>
            <tr>
              <td align="center">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5f5f7;">
                  <tbody>
                    <tr>
                      <td style="padding:0 20px 16px 20px;" align="center">
                        <div style="display:inline-block;font-size:24px;font-weight:800;letter-spacing:0.5px;color:#ffffff;">
                          The Bae Agenda
                        </div>
                        <div style="margin-top:8px;font-size:13px;line-height:20px;color:#a1a1aa;">
                          New booking inquiry
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 20px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#14141c;border:1px solid #27272f;border-radius:18px;">
                          <tbody>
                            <tr>
                              <td style="padding:32px 28px 24px 28px;">
                                <div style="font-size:22px;font-weight:700;line-height:30px;color:#ffffff;margin:0 0 16px 0;">
                                  New inquiry received
                                </div>
                                <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#e4e4e7;">
                                  A new booking inquiry was submitted through the site. Reply directly to continue the conversation with the client.
                                </p>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;background-color:#101017;border:1px solid #27272f;border-radius:14px;">
                                  <tbody>
                                    ${fields.map(([label, value]) => renderField(label, value)).join('')}
                                  </tbody>
                                </table>
                                <p style="margin:16px 0 0 0;font-size:13px;line-height:22px;color:#a1a1aa;">
                                  This alert was generated automatically by the booking form.
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 20px 0 20px;text-align:center;font-size:12px;line-height:20px;color:#71717a;">
                        © 2026 The Bae Agenda<br />
                        thebaeagenda.com
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

function buildClientBookingEmailHtml(args: {
  eyebrow?: string
  heading: string
  intro: string
  fields: ReadonlyArray<readonly [string, string]>
  closing: string
}) {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" lang="en">
      <head>
        <meta content="width=device-width" name="viewport" />
        <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
        <meta content="IE=edge" http-equiv="X-UA-Compatible" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
        <title>The Bae Agenda</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0b0b10;">
        <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center" style="background-color:#0b0b10;margin:0;padding:24px 0;width:100%;">
          <tbody>
            <tr>
              <td align="center">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5f5f7;">
                  <tbody>
                    <tr>
                      <td style="padding:0 20px 16px 20px;" align="center">
                        <div style="display:inline-block;font-size:24px;font-weight:800;letter-spacing:0.5px;color:#ffffff;">
                          The Bae Agenda
                        </div>
                        <div style="margin-top:8px;font-size:13px;line-height:20px;color:#a1a1aa;">
                          ${escapeHtml(args.eyebrow ?? 'DJ B.A.E. Bookings')}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 20px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#14141c;border:1px solid #27272f;border-radius:18px;">
                          <tbody>
                            <tr>
                              <td style="padding:32px 28px 24px 28px;">
                                <div style="font-size:22px;font-weight:700;line-height:30px;color:#ffffff;margin:0 0 16px 0;">
                                  ${escapeHtml(args.heading)}
                                </div>
                                <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#e4e4e7;">
                                  ${args.intro}
                                </p>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;background-color:#101017;border:1px solid #27272f;border-radius:14px;">
                                  <tbody>
                                    ${args.fields.map(([label, value]) => renderField(label, value)).join('')}
                                  </tbody>
                                </table>
                                <p style="margin:16px 0 0 0;font-size:14px;line-height:24px;color:#a1a1aa;">
                                  ${escapeHtml(args.closing)}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:18px 20px 0 20px;text-align:center;font-size:12px;line-height:20px;color:#71717a;">
                        © 2026 The Bae Agenda<br />
                        thebaeagenda.com
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
}

async function sendEmail(args: {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string
  }>
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
        attachments: args.attachments,
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
      html: buildOwnerBookingEmailHtml(payload, eventDateTime),
    }),
    sendBookingInquiryReceipt({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      eventName: payload.eventName,
      eventDate: payload.eventDate,
      eventTimeZone: payload.eventTimeZone,
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

export async function sendBookingInquiryReceipt(payload: BookingInquiryReceiptPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)

  return sendEmail({
    to: payload.email,
    subject: `We received your booking inquiry for ${payload.eventName}`,
    text: [
      `Hi ${guestName},`,
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
    html: buildClientBookingEmailHtml({
      eyebrow: 'Booking inquiry received',
      heading: 'We got your inquiry',
      intro: `Hi ${escapeHtml(guestName)}, thanks for reaching out. Your booking inquiry came through successfully.`,
      fields: [
        ['Event', payload.eventName],
        ['Date', eventDateTime],
        ['Time Zone', payload.eventTimeZone],
      ] as const,
      closing: 'We will follow up soon.',
    }),
  })
}

export async function sendBookingConfirmedNotification(payload: BookingConfirmedNotificationPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)
  const location = [payload.venue, payload.city].filter(Boolean).join(', ')

  return sendEmail({
    to: payload.email,
    subject: `Your booking is confirmed for ${payload.eventName}`,
    text: [
      `Hi ${guestName},`,
      '',
      `Your booking for ${payload.eventName} is officially confirmed.`,
      '',
      `Event: ${payload.eventName}`,
      `Date: ${eventDateTime}`,
      `Time Zone: ${payload.eventTimeZone}`,
      ...(location ? [`Location: ${location}`] : []),
      '',
      'We are locked in and will follow up with any remaining details if needed.',
      '',
      'DJ B.A.E. Bookings',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Booking confirmed',
      heading: 'Your booking is confirmed',
      intro: `Hi ${escapeHtml(guestName)}, your booking for <strong>${escapeHtml(payload.eventName)}</strong> is officially confirmed.`,
      fields: [
        ['Event', payload.eventName],
        ['Date', eventDateTime],
        ['Time Zone', payload.eventTimeZone],
        ...(location ? [['Location', location] as const] : []),
      ],
      closing: 'We are locked in and will follow up with any remaining details if needed.',
    }),
  })
}

export async function sendBookingDepositReminder(payload: BookingDepositReminderPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)

  return sendEmail({
    to: payload.email,
    subject: `Deposit reminder for ${payload.eventName}`,
    text: [
      `Hi ${guestName},`,
      '',
      `This is a quick reminder that the deposit for ${payload.eventName} is still outstanding.`,
      '',
      `Event: ${payload.eventName}`,
      `Date: ${eventDateTime}`,
      `Deposit due: ${payload.depositDue}`,
      `Payment link: ${payload.payUrl}`,
      '',
      'If you prefer Zelle or Cash App, reply to this email and we will help you confirm the transfer.',
      'If you have any questions, just reply to this email.',
      '',
      'DJ B.A.E. Bookings',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Deposit reminder',
      heading: 'Deposit reminder',
      intro: `Hi ${escapeHtml(guestName)}, this is a quick reminder that the deposit for <strong>${escapeHtml(payload.eventName)}</strong> is still outstanding.`,
      fields: [
        ['Event', payload.eventName],
        ['Date', eventDateTime],
        ['Deposit due', payload.depositDue],
        ['Payment link', payload.payUrl],
      ] as const,
      closing: 'Use the payment link above for Stripe Checkout, or reply if you need Zelle or Cash App instructions.',
    }),
  })
}

export async function sendBookingBalanceReminder(payload: BookingBalanceReminderPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)

  return sendEmail({
    to: payload.email,
    subject: `Balance reminder for ${payload.eventName}`,
    text: [
      `Hi ${guestName},`,
      '',
      `This is a quick reminder that the remaining balance for ${payload.eventName} is still outstanding.`,
      '',
      `Event: ${payload.eventName}`,
      `Date: ${eventDateTime}`,
      `Balance due: ${payload.balanceDue}`,
      '',
      'If you have any questions, just reply to this email.',
      '',
      'DJ B.A.E. Bookings',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Balance reminder',
      heading: 'Balance reminder',
      intro: `Hi ${escapeHtml(guestName)}, this is a quick reminder that the remaining balance for <strong>${escapeHtml(payload.eventName)}</strong> is still outstanding.`,
      fields: [
        ['Event', payload.eventName],
        ['Date', eventDateTime],
        ['Balance due', payload.balanceDue],
      ] as const,
      closing: 'If you have any questions, just reply to this email.',
    }),
  })
}

export async function sendBookingEventReminder(payload: BookingEventReminderPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)
  const location = [payload.venue, payload.city].filter(Boolean).join(', ')

  return sendEmail({
    to: payload.email,
    subject: `Event reminder for ${payload.eventName}`,
    text: [
      `Hi ${guestName},`,
      '',
      `This is a quick reminder for your upcoming event: ${payload.eventName}.`,
      '',
      `Event: ${payload.eventName}`,
      `Date: ${eventDateTime}`,
      `Time Zone: ${payload.eventTimeZone}`,
      ...(location ? [`Location: ${location}`] : []),
      '',
      'If any details have changed, just reply to this email.',
      '',
      'DJ B.A.E. Bookings',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Event reminder',
      heading: 'Your event is coming up',
      intro: `Hi ${escapeHtml(guestName)}, this is a quick reminder for your upcoming event: <strong>${escapeHtml(payload.eventName)}</strong>.`,
      fields: [
        ['Event', payload.eventName],
        ['Date', eventDateTime],
        ['Time Zone', payload.eventTimeZone],
        ...(location ? [['Location', location] as const] : []),
      ],
      closing: 'If any details have changed, just reply to this email.',
    }),
  })
}

export async function sendInvoiceNotification(payload: InvoiceNotificationPayload) {
  const greetingName = payload.clientName.trim() || 'there'

  return sendEmail({
    to: payload.to,
    subject: `Invoice from DJ B.A.E. for ${payload.eventName}`,
    text: [
      `Hi ${greetingName},`,
      '',
      `Your invoice for ${payload.eventName} is attached.`,
      `Invoice #: ${payload.invoiceNumber}`,
      `Balance due: ${payload.balanceDue}`,
      '',
      'If you have any questions, just reply to this email.',
      '',
      'DJ B.A.E. Bookings',
    ].join('\n'),
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">
        <head>
          <meta content="width=device-width" name="viewport" />
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
          <meta content="IE=edge" http-equiv="X-UA-Compatible" />
          <meta name="x-apple-disable-message-reformatting" />
          <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
          <title>The Bae Agenda</title>
        </head>
        <body style="margin:0;padding:0;background-color:#0b0b10;">
          <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center" style="background-color:#0b0b10;margin:0;padding:24px 0;width:100%;">
            <tbody>
              <tr>
                <td align="center">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5f5f7;">
                    <tbody>
                      <tr>
                        <td style="padding:0 20px 16px 20px;" align="center">
                          <div style="display:inline-block;font-size:24px;font-weight:800;letter-spacing:0.5px;color:#ffffff;">
                            The Bae Agenda
                          </div>
                          <div style="margin-top:8px;font-size:13px;line-height:20px;color:#a1a1aa;">
                            Culture. Events. Community.
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#14141c;border:1px solid #27272f;border-radius:18px;">
                            <tbody>
                              <tr>
                                <td style="padding:32px 28px 24px 28px;">
                                  <div style="font-size:22px;font-weight:700;line-height:30px;color:#ffffff;margin:0 0 16px 0;">
                                    Your invoice is ready
                                  </div>
                                  <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#e4e4e7;">
                                    Hi ${escapeHtml(greetingName)}, your invoice for <strong>${escapeHtml(payload.eventName)}</strong> is attached to this email.
                                  </p>
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;background-color:#101017;border:1px solid #27272f;border-radius:14px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:18px 18px 8px 18px;">
                                          <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px;">Event</div>
                                          <div style="font-size:16px;color:#ffffff;font-weight:600;">${escapeHtml(payload.eventName)}</div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="padding:8px 18px;">
                                          <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px;">Invoice #</div>
                                          <div style="font-size:16px;color:#ffffff;">${escapeHtml(payload.invoiceNumber)}</div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="padding:8px 18px 18px 18px;">
                                          <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px;">Balance Due</div>
                                          <div style="font-size:16px;color:#ffffff;font-weight:600;">${escapeHtml(payload.balanceDue)}</div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <p style="margin:16px 0 0 0;font-size:14px;line-height:24px;color:#a1a1aa;">
                                    If you have any questions, just reply to this email.
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:18px 20px 0 20px;text-align:center;font-size:12px;line-height:20px;color:#71717a;">
                          © 2026 The Bae Agenda<br />
                          thebaeagenda.com
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `,
    attachments: [
      {
        filename: payload.pdfFilename,
        content: payload.pdfBase64,
      },
    ],
  })
}

export async function sendW9Notification(payload: W9NotificationPayload) {
  const greetingName = payload.clientName.trim() || 'there'

  return sendEmail({
    to: payload.to,
    subject: `W-9 from DJ B.A.E. for ${payload.eventName}`,
    text: [
      `Hi ${greetingName},`,
      '',
      `Attached is DJ B.A.E.'s W-9 for ${payload.eventName}.`,
      `Payment recorded: ${payload.paymentAmount}`,
      '',
      'If you need anything else for payment processing, just reply to this email.',
      '',
      'DJ B.A.E. Bookings',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'W-9 from DJ B.A.E.',
      heading: 'W-9 attached',
      intro: `Hi ${escapeHtml(greetingName)}, attached is DJ B.A.E.'s <strong>W-9</strong> for <strong>${escapeHtml(payload.eventName)}</strong>.`,
      fields: [
        ['Event', payload.eventName],
        ['Payment recorded', payload.paymentAmount],
      ] as const,
      closing: 'If you need anything else for payment processing, just reply to this email.',
    }),
    attachments: [
      {
        filename: payload.pdfFilename,
        content: payload.pdfBase64,
      },
    ],
  })
}
