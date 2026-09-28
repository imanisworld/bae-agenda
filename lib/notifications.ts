import { getPaymentInstructionRows, getPaymentInstructionTextLines } from '@/lib/payment-instructions'
import { resolveEmailDelivery } from '@/lib/email-delivery'

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
  totalAmount?: string | null
  depositAmount?: string | null
  remainingAmount?: string | null
  venue?: string | null
  city?: string | null
  depositDue?: string | null
  payUrl?: string | null
}

type BookingInquiryReceiptPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventType?: string | null
  eventDate: string
  eventTimeZone: string
  location?: string | null
}

type BookingBalanceReminderPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventDate: string
  eventTimeZone: string
  balanceDue: string
  payUrl?: string | null
}

type BookingPostEventFollowUpPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventDate: string
  eventTimeZone: string
  location?: string | null
}

type BookingReviewRequestPayload = {
  firstName: string
  lastName?: string | null
  email: string
  eventName: string
  eventDate: string
  eventTimeZone: string
  reviewUrl: string
}

type InvoiceNotificationPayload = {
  to: string
  clientName: string
  eventName: string
  invoiceNumber: string
  balanceDue: string
  pdfBase64: string
  pdfFilename: string
  dueDate?: string | null
  mode?: 'invoice' | 'reminder'
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
  | { ok: false; reason: 'delivery_disabled' | 'missing_config' | 'request_failed'; detail?: string }

type BookingNotificationDispatchSummary = {
  ownerEmailSent: boolean
  clientReceiptSent: boolean
  ownerSmsSent: boolean
}

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

export async function sendEmailNotification(args: {
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
  const delivery = resolveEmailDelivery(args)
  if (!delivery.enabled) {
    return {
      ok: false,
      reason: 'delivery_disabled',
      detail: `Email delivery is disabled in ${delivery.environment}.`,
    }
  }

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
        to: [delivery.to],
        subject: delivery.subject,
        text: args.text,
        html: args.html,
        reply_to: delivery.replyTo,
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

export async function sendClientPortalCodeSms(to: string, code: string): Promise<NotificationResult> {
  return sendSms(
    to,
    `Your DJ B.A.E. portal code is ${code}. It expires in 10 minutes. If you did not request it, you can ignore this message.`
  )
}

export async function sendBookingNotifications(payload: BookingNotificationPayload) {
  const ownerSummary = buildBookingSummaryLines(payload).join('\n')
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ')

  const tasks: Array<Promise<NotificationResult>> = [
    sendEmailNotification({
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
      eventType: payload.eventType,
      eventDate: payload.eventDate,
      eventTimeZone: payload.eventTimeZone,
      location: [payload.venue, payload.city].filter(Boolean).join(', ') || null,
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
  const summary: BookingNotificationDispatchSummary = {
    ownerEmailSent: false,
    clientReceiptSent: false,
    ownerSmsSent: false,
  }

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[booking-notification:${index}]`, result.reason)
      return
    }

    if (!result.value.ok) {
      console.error(`[booking-notification:${index}]`, result.value.reason, result.value.detail ?? '')
      return
    }

    if (index === 0) summary.ownerEmailSent = true
    if (index === 1) summary.clientReceiptSent = true
    if (index === 2) summary.ownerSmsSent = true
  })

  return summary
}

export async function sendBookingInquiryReceipt(payload: BookingInquiryReceiptPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)
  const eventType = payload.eventType?.trim() || payload.eventName
  const location = payload.location?.trim()
  const locationText = location ? ` in ${location}` : ''

  return sendEmailNotification({
    to: payload.email,
    subject: 'DJ B.A.E. inquiry received',
    text: [
      `Hey ${guestName},`,
      '',
      `Got your request for ${eventType} on ${eventDateTime}${locationText}.`,
      '',
      'I’m reviewing the details now and I’ll follow up shortly with availability and next steps.',
      '',
      'If anything changes before then, just reply to this email.',
      '',
      '– DJ B.A.E.',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Booking inquiry received',
      heading: 'Booking Request Received',
      intro: `Hey ${escapeHtml(guestName)}, got your request for <strong>${escapeHtml(eventType)}</strong> on <strong>${escapeHtml(eventDateTime)}</strong>${location ? ` in <strong>${escapeHtml(location)}</strong>` : ''}.`,
      fields: [
        ['Event', payload.eventName],
        ...(payload.eventType ? [['Event Type', payload.eventType] as const] : []),
        ['Event Date', eventDateTime],
        ...(location ? [['Location', location] as const] : []),
      ] as const,
      closing: 'I’m reviewing the details now and I’ll follow up shortly with availability and next steps. If anything changes before then, just reply to this email.',
    }),
  })
}

export async function sendBookingConfirmedNotification(payload: BookingConfirmedNotificationPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)
  const hasDepositLink = Boolean(payload.depositDue && payload.payUrl)
  const paymentInstructionRows = getPaymentInstructionRows({
    cardLabel: 'Card (secure link)',
    cardUrl: hasDepositLink ? payload.payUrl : null,
  })
  const paymentInstructionLines = getPaymentInstructionTextLines({
    cardLabel: 'Card (secure link)',
    cardUrl: hasDepositLink ? payload.payUrl : null,
  })

  return sendEmailNotification({
    to: payload.email,
    subject: 'DJ B.A.E. booking confirmed',
    text: [
      `Hey ${guestName},`,
      '',
      `Your event on ${eventDateTime} is confirmed.`,
      '',
      `Total: ${payload.totalAmount ?? 'TBD'}`,
      `Deposit Due: ${payload.depositAmount ?? payload.depositDue ?? 'TBD'}`,
      `Remaining Balance: ${payload.remainingAmount ?? 'TBD'}`,
      '',
      'Payment options:',
      ...paymentInstructionLines,
      '',
      hasDepositLink
        ? 'Send the deposit through the payment link above to lock the date in fully.'
        : 'The deposit is already covered. Reply here if you need anything else before the event.',
      '',
      '– DJ B.A.E.',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Booking confirmed',
      heading: 'Booking Confirmed – Deposit Required',
      intro: `Hey ${escapeHtml(guestName)}, your event on <strong>${escapeHtml(eventDateTime)}</strong> is confirmed.`,
      fields: [
        ['Total', payload.totalAmount ?? 'TBD'],
        ['Deposit Due', payload.depositAmount ?? payload.depositDue ?? 'TBD'],
        ['Remaining Balance', payload.remainingAmount ?? 'TBD'],
        ...paymentInstructionRows,
      ],
      closing: hasDepositLink
        ? 'Send the deposit through the payment link above to lock the date in fully.'
        : 'The deposit is already covered. Reply here if you need anything else before the event.',
    }),
  })
}

export async function sendBookingBalanceReminder(payload: BookingBalanceReminderPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)
  const paymentInstructionRows = getPaymentInstructionRows({
    cardLabel: 'Card',
    cardUrl: payload.payUrl,
  })
  const paymentInstructionLines = getPaymentInstructionTextLines({
    cardLabel: 'Card',
    cardUrl: payload.payUrl,
  })

  return sendEmailNotification({
    to: payload.email,
    subject: 'DJ B.A.E. final payment reminder',
    text: [
      `Hey ${guestName},`,
      '',
      `Your event is coming up on ${eventDateTime}.`,
      '',
      `The remaining balance of ${payload.balanceDue} is due before the event.`,
      '',
      'Payment options:',
      ...paymentInstructionLines,
      '',
      'Once the balance is sent, just reply here so I can mark it complete on my side.',
      '',
      '– DJ B.A.E.',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Final payment due',
      heading: 'Final Payment Due',
      intro: `Hey ${escapeHtml(guestName)}, your event is coming up on <strong>${escapeHtml(eventDateTime)}</strong>. The remaining balance of <strong>${escapeHtml(payload.balanceDue)}</strong> is due before the event.`,
      fields: [
        ['Remaining Balance', payload.balanceDue],
        ...paymentInstructionRows,
      ] as const,
      closing: 'Once the balance is sent, just reply here so I can mark it complete on my side.',
    }),
  })
}

export async function sendBookingPostEventFollowUp(payload: BookingPostEventFollowUpPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)

  return sendEmailNotification({
    to: payload.email,
    subject: 'Thank you for booking DJ B.A.E.',
    text: [
      `Hey ${guestName},`,
      '',
      `Appreciate you for having me for ${payload.eventName} on ${eventDateTime}.`,
      '',
      'Thank you for trusting me with the room. If you have any photos, videos, or feedback you want to share, just reply here.',
      'If you are planning anything else later on, I would love to work together again.',
      '',
      '- DJ B.A.E.',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Thank you',
      heading: 'Appreciate You',
      intro: `Hey ${escapeHtml(guestName)}, appreciate you for having me for <strong>${escapeHtml(payload.eventName)}</strong> on <strong>${escapeHtml(eventDateTime)}</strong>.`,
      fields: [
        ['Event', payload.eventName],
        ['Event Date', eventDateTime],
        ...(payload.location ? [['Location', payload.location] as const] : []),
      ] as const,
      closing: 'Thank you for trusting me with the room. If you have any photos, videos, or feedback you want to share, just reply here.',
    }),
  })
}

export async function sendBookingReviewRequest(payload: BookingReviewRequestPayload) {
  const guestName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim() || payload.firstName
  const eventDateTime = formatEventDateTime(payload.eventDate, payload.eventTimeZone)

  return sendEmailNotification({
    to: payload.email,
    subject: 'How did DJ B.A.E. do?',
    text: [
      `Hey ${guestName},`,
      '',
      `Thank you again for having me for ${payload.eventName} on ${eventDateTime}.`,
      '',
      'If you have a minute, I would really appreciate a quick review about the experience:',
      payload.reviewUrl,
      '',
      'Your feedback helps a lot and makes it easier for future clients to know what working together feels like.',
      '',
      '- DJ B.A.E.',
    ].join('\n'),
    html: buildClientBookingEmailHtml({
      eyebrow: 'Quick review request',
      heading: 'Share A Quick Review',
      intro: `Hey ${escapeHtml(guestName)}, thank you again for having me for <strong>${escapeHtml(payload.eventName)}</strong> on <strong>${escapeHtml(eventDateTime)}</strong>.`,
      fields: [
        ['Event', payload.eventName],
        ['Event Date', eventDateTime],
        ['Review Link', payload.reviewUrl],
      ] as const,
      closing: `If you have a minute, I would really appreciate a quick review. You can share it here: <a href="${escapeHtml(payload.reviewUrl)}" style="color:#c084fc;">${escapeHtml(payload.reviewUrl)}</a>`,
    }),
  })
}

export async function sendInvoiceNotification(payload: InvoiceNotificationPayload) {
  const greetingName = payload.clientName.trim() || 'there'
  const isReminder = payload.mode === 'reminder'
  const subject = isReminder
    ? `Reminder: invoice ${payload.invoiceNumber} from DJ B.A.E.`
    : `Invoice from DJ B.A.E. for ${payload.eventName}`
  const heading = isReminder ? 'Friendly invoice reminder' : 'Your invoice is ready'
  const intro = isReminder
    ? `Hi ${escapeHtml(greetingName)}, this is a reminder that invoice <strong>#${escapeHtml(payload.invoiceNumber)}</strong> for <strong>${escapeHtml(payload.eventName)}</strong> still has a balance due.`
    : `Hi ${escapeHtml(greetingName)}, your invoice for <strong>${escapeHtml(payload.eventName)}</strong> is attached to this email.`
  const closing = isReminder
    ? 'The current invoice is attached again for convenience. If payment has already been sent, you can ignore this reminder or reply with any questions.'
    : 'If you have any questions, just reply to this email.'

  return sendEmailNotification({
    to: payload.to,
    subject,
    text: [
      `Hi ${greetingName},`,
      '',
      isReminder
        ? `This is a reminder for invoice #${payload.invoiceNumber} for ${payload.eventName}.`
        : `Your invoice for ${payload.eventName} is attached.`,
      `Invoice #: ${payload.invoiceNumber}`,
      `Balance due: ${payload.balanceDue}`,
      ...(payload.dueDate ? [`Due date: ${payload.dueDate}`] : []),
      '',
      isReminder
        ? 'The current invoice is attached again for convenience.'
        : 'If you have any questions, just reply to this email.',
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
                            DJ B.A.E. Bookings
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
                                    ${heading}
                                  </div>
                                  <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#e4e4e7;">
                                    ${intro}
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
                                        <td style="padding:8px 18px ${payload.dueDate ? '8px' : '18px'} 18px;">
                                          <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px;">Balance Due</div>
                                          <div style="font-size:16px;color:#ffffff;font-weight:600;">${escapeHtml(payload.balanceDue)}</div>
                                        </td>
                                      </tr>
                                      ${payload.dueDate ? `
                                      <tr>
                                        <td style="padding:8px 18px 18px 18px;">
                                          <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px;">Due Date</div>
                                          <div style="font-size:16px;color:#ffffff;">${escapeHtml(payload.dueDate)}</div>
                                        </td>
                                      </tr>
                                      ` : ''}
                                    </tbody>
                                  </table>
                                  <p style="margin:16px 0 0 0;font-size:14px;line-height:24px;color:#a1a1aa;">
                                    ${escapeHtml(closing)}
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

  return sendEmailNotification({
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
