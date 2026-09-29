import { NextRequest, NextResponse } from 'next/server'
import { sendBookingPostEventFollowUpEmail, sendBookingReviewRequestEmail } from '@/lib/booking-email-workflows'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getBalanceReminderPayloadFromBooking,
  type BookingBalanceReminderSource,
} from '@/lib/booking-email-payloads'
import { getScheduledReminderQueryWindow, isCalendarDaysOut } from '@/lib/date-time'
import { sendBookingBalanceReminder } from '@/lib/notifications'
import { logEvent } from '@/lib/monitoring'

function isAuthorizedCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

async function appendBookingTimelineNote(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
  body: string
) {
  const { error } = await admin
    .from('notes')
    .insert({
      booking_id: bookingId,
      body,
    })

  if (error) {
    logEvent('error', 'Scheduled reminder timeline note failed', {
      operation: 'cron_timeline_note',
      bookingId,
      errorMessage: error.message,
    })
  }
}

type CronBookingReminderSource = BookingBalanceReminderSource & {
  status: 'confirmed' | 'completed'
  post_event_follow_up_sent_at: string | null
  review_request_sent_at: string | null
  last_balance_reminder_sent_at: string | null
}

async function sendScheduledBalanceReminder(
  admin: ReturnType<typeof createAdminClient>,
  booking: CronBookingReminderSource,
  nowIso: string
) {
  if (!booking.event_timezone || !isCalendarDaysOut(booking.event_date, booking.event_timezone, 7)) {
    return false
  }

  if (booking.last_balance_reminder_sent_at) {
    return false
  }

  const payload = getBalanceReminderPayloadFromBooking(booking)
  if (!payload) {
    return false
  }

  const result = await sendBookingBalanceReminder(payload, {
    idempotencyKey: `booking-balance-reminder-${booking.id}`,
  })
  if (!result.ok) {
    logEvent('error', 'Scheduled balance reminder failed', {
      operation: 'cron_balance_reminder',
      bookingId: booking.id,
      reason: result.reason,
      detail: result.detail,
    })
    return false
  }

  await admin
    .from('bookings')
    .update({ last_balance_reminder_sent_at: nowIso })
    .eq('id', booking.id)

  await appendBookingTimelineNote(
    admin,
    booking.id,
    `Scheduled final payment reminder email sent to ${payload.email}.`
  )

  return true
}

async function sendScheduledPostEventFollowUp(
  admin: ReturnType<typeof createAdminClient>,
  booking: CronBookingReminderSource,
  now: Date,
  nowIso: string
) {
  if (booking.status !== 'completed' || booking.post_event_follow_up_sent_at) {
    return false
  }

  const eventDate = new Date(booking.event_date)
  if (Number.isNaN(eventDate.getTime())) {
    return false
  }

  const hoursSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60)
  if (hoursSinceEvent < 20 || hoursSinceEvent >= 72) {
    return false
  }

  const result = await sendBookingPostEventFollowUpEmail(admin, booking.id, { nowIso, mode: 'scheduled' })
  if (result.status === 'failed') {
    logEvent('error', 'Scheduled post-event email failed', {
      operation: 'cron_post_event_follow_up',
      bookingId: booking.id,
      detail: result.detail,
    })
    return false
  }

  return result.status === 'sent'
}

async function sendScheduledReviewRequest(
  admin: ReturnType<typeof createAdminClient>,
  booking: CronBookingReminderSource,
  now: Date,
  nowIso: string
) {
  if (booking.status !== 'completed' || booking.review_request_sent_at) {
    return false
  }

  const eventDate = new Date(booking.event_date)
  if (Number.isNaN(eventDate.getTime())) {
    return false
  }

  const hoursSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60)
  if (hoursSinceEvent < 72 || hoursSinceEvent >= 240) {
    return false
  }

  const result = await sendBookingReviewRequestEmail(admin, booking.id, { nowIso, mode: 'scheduled' })
  if (result.status === 'failed') {
    logEvent('error', 'Scheduled review request failed', {
      operation: 'cron_review_request',
      bookingId: booking.id,
      detail: result.detail,
    })
    return false
  }

  return result.status === 'sent'
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const nowIso = now.toISOString()
  const { windowStart, windowEnd } = getScheduledReminderQueryWindow(now)

  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      event_date,
      event_timezone,
      status,
      quote,
      venue,
      city,
      post_event_follow_up_sent_at,
      review_request_sent_at,
      last_balance_reminder_sent_at,
      clients(first_name, last_name, email),
      payments(amount, status)
    `)
    .in('status', ['confirmed', 'completed'])
    .lte('event_date', windowEnd.toISOString())
    .gte('event_date', windowStart.toISOString())

  if (error) {
    logEvent('error', 'Scheduled reminder booking query failed', {
      operation: 'cron_booking_query',
      errorMessage: error.message,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const bookings = (data ?? []) as CronBookingReminderSource[]
  let balanceSent = 0
  let followUpSent = 0
  let reviewRequestSent = 0
  let skipped = 0

  for (const booking of bookings) {
    const [balanceReminderSent, postEventFollowUpSent, reviewRequestEmailSent] = await Promise.all([
      sendScheduledBalanceReminder(admin, booking, nowIso),
      sendScheduledPostEventFollowUp(admin, booking, now, nowIso),
      sendScheduledReviewRequest(admin, booking, now, nowIso),
    ])

    if (balanceReminderSent) balanceSent += 1
    if (postEventFollowUpSent) followUpSent += 1
    if (reviewRequestEmailSent) reviewRequestSent += 1
    if (!balanceReminderSent && !postEventFollowUpSent && !reviewRequestEmailSent) skipped += 1
  }

  return NextResponse.json({
    ok: true,
    processed: bookings.length,
    balanceSent,
    followUpSent,
    reviewRequestSent,
    sent: balanceSent + followUpSent + reviewRequestSent,
    skipped,
  })
}
