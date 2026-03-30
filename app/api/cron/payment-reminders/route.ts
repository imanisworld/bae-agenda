import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getBalanceReminderPayloadFromBooking,
  getEventReminderPayloadFromBooking,
  type BookingBalanceReminderSource,
  type BookingEventReminderSource,
} from '@/lib/booking-email-payloads'
import { isCalendarDaysOut, isHoursAwayWithinRange } from '@/lib/date-time'
import { sendBookingBalanceReminder, sendBookingEventReminder } from '@/lib/notifications'

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
    console.error('[cron-payment-reminders] note insert failed:', error.message)
  }
}

type CronBookingReminderSource = BookingBalanceReminderSource &
  BookingEventReminderSource & {
    last_balance_reminder_sent_at: string | null
    last_event_reminder_sent_at: string | null
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

  const result = await sendBookingBalanceReminder(payload)
  if (!result.ok) {
    console.error('[cron-payment-reminders] balance email failed:', booking.id, result.reason, result.detail ?? '')
    return false
  }

  await admin
    .from('bookings')
    .update({ last_balance_reminder_sent_at: nowIso })
    .eq('id', booking.id)

  await appendBookingTimelineNote(
    admin,
    booking.id,
    `Scheduled balance reminder email sent to ${payload.email}.`
  )

  return true
}

async function sendScheduledEventReminder(
  admin: ReturnType<typeof createAdminClient>,
  booking: CronBookingReminderSource,
  now: Date,
  nowIso: string
) {
  if (booking.last_event_reminder_sent_at) {
    return false
  }

  if (!isHoursAwayWithinRange(booking.event_date, 47, 49, now)) {
    return false
  }

  const payload = getEventReminderPayloadFromBooking(booking)
  if (!payload) {
    return false
  }

  const result = await sendBookingEventReminder(payload)
  if (!result.ok) {
    console.error('[cron-payment-reminders] event email failed:', booking.id, result.reason, result.detail ?? '')
    return false
  }

  await admin
    .from('bookings')
    .update({ last_event_reminder_sent_at: nowIso })
    .eq('id', booking.id)

  await appendBookingTimelineNote(
    admin,
    booking.id,
    `Scheduled event reminder email sent to ${payload.email} about 48 hours before the event.`
  )

  return true
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const nowIso = now.toISOString()
  const windowEnd = new Date(now)
  windowEnd.setDate(windowEnd.getDate() + 8)

  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      event_date,
      event_timezone,
      quote,
      venue,
      city,
      last_balance_reminder_sent_at,
      last_event_reminder_sent_at,
      clients(first_name, last_name, email),
      payments(amount, status)
    `)
    .eq('status', 'confirmed')
    .lte('event_date', windowEnd.toISOString())
    .gte('event_date', now.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const bookings = (data ?? []) as CronBookingReminderSource[]
  let balanceSent = 0
  let eventSent = 0
  let skipped = 0

  for (const booking of bookings) {
    const [balanceReminderSent, eventReminderSent] = await Promise.all([
      sendScheduledBalanceReminder(admin, booking, nowIso),
      sendScheduledEventReminder(admin, booking, now, nowIso),
    ])

    if (balanceReminderSent) balanceSent += 1
    if (eventReminderSent) eventSent += 1
    if (!balanceReminderSent && !eventReminderSent) skipped += 1
  }

  return NextResponse.json({
    ok: true,
    processed: bookings.length,
    balanceSent,
    eventSent,
    sent: balanceSent + eventSent,
    skipped,
  })
}
