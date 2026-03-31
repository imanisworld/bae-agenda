import { getDepositReceivedPayloadFromBooking, getFullyPaidPayloadFromBooking, getPostEventFollowUpPayloadFromBooking, type BookingDepositReceivedSource, type BookingFullyPaidSource, type BookingPostEventFollowUpSource } from '@/lib/booking-email-payloads'
import { sendBookingDepositReceivedNotification, sendBookingFullyPaidNotification, sendBookingPostEventFollowUp } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>
type BookingEmailMode = 'auto' | 'resend' | 'scheduled'

type DispatchResult =
  | { status: 'sent'; email: string }
  | { status: 'skipped'; reason: 'already_sent' | 'not_ready' | 'not_found' }
  | { status: 'failed'; detail: string }

async function appendBookingTimelineNote(admin: AdminClient, bookingId: string, body: string) {
  const { error } = await admin.from('notes').insert({ booking_id: bookingId, body })
  if (error) {
    console.error('[booking-email-workflows] note insert failed:', error.message)
  }
}

async function stampBookingEmail(admin: AdminClient, bookingId: string, column: 'deposit_received_email_sent_at' | 'fully_paid_email_sent_at' | 'post_event_follow_up_sent_at', sentAt: string) {
  const { error } = await admin.from('bookings').update({ [column]: sentAt }).eq('id', bookingId)
  if (error) {
    console.error('[booking-email-workflows] sent-at stamp failed:', column, error.message)
  }
}

function getDepositReceivedNote(email: string, mode: BookingEmailMode) {
  if (mode === 'resend') return `Deposit received email resent to ${email}.`
  return `Deposit received email sent to ${email} after payment confirmation.`
}

function getFullyPaidNote(email: string, mode: BookingEmailMode) {
  if (mode === 'resend') return `Fully paid email resent to ${email}.`
  return `Fully paid email sent to ${email} after the booking was paid in full.`
}

function getPostEventFollowUpNote(email: string, mode: BookingEmailMode) {
  if (mode === 'resend') return `Post-event follow-up email resent to ${email}.`
  if (mode === 'scheduled') return `Scheduled post-event follow-up email sent to ${email}.`
  return `Post-event follow-up email sent to ${email} after the booking was completed.`
}

async function getDepositReceivedSource(admin: AdminClient, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      event_name,
      event_date,
      event_timezone,
      quote,
      deposit_amount,
      venue,
      city,
      deposit_received_email_sent_at,
      clients(first_name, last_name, email),
      payments(amount, status)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) return null
  return data as BookingDepositReceivedSource & { deposit_received_email_sent_at: string | null }
}

async function getFullyPaidSource(admin: AdminClient, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      event_name,
      event_date,
      event_timezone,
      quote,
      venue,
      city,
      fully_paid_email_sent_at,
      clients(first_name, last_name, email),
      payments(amount, status)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) return null
  return data as BookingFullyPaidSource & { fully_paid_email_sent_at: string | null }
}

async function getPostEventFollowUpSource(admin: AdminClient, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      event_name,
      event_date,
      event_timezone,
      venue,
      city,
      post_event_follow_up_sent_at,
      clients(first_name, last_name, email)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) return null
  return data as BookingPostEventFollowUpSource & { post_event_follow_up_sent_at: string | null }
}

export async function sendBookingDepositReceivedEmail(admin: AdminClient, bookingId: string, options?: { force?: boolean; nowIso?: string; mode?: BookingEmailMode }): Promise<DispatchResult> {
  const booking = await getDepositReceivedSource(admin, bookingId)
  if (!booking) return { status: 'skipped', reason: 'not_found' }
  if (!options?.force && booking.deposit_received_email_sent_at) return { status: 'skipped', reason: 'already_sent' }

  const payload = getDepositReceivedPayloadFromBooking(booking)
  if (!payload) return { status: 'skipped', reason: 'not_ready' }

  const result = await sendBookingDepositReceivedNotification(payload)
  if (!result.ok) return { status: 'failed', detail: result.detail || 'Unable to send deposit received email.' }

  if (!booking.deposit_received_email_sent_at) {
    await stampBookingEmail(admin, bookingId, 'deposit_received_email_sent_at', options?.nowIso ?? new Date().toISOString())
  }
  await appendBookingTimelineNote(admin, bookingId, getDepositReceivedNote(payload.email, options?.mode ?? 'auto'))
  return { status: 'sent', email: payload.email }
}

export async function sendBookingFullyPaidEmail(admin: AdminClient, bookingId: string, options?: { force?: boolean; nowIso?: string; mode?: BookingEmailMode }): Promise<DispatchResult> {
  const booking = await getFullyPaidSource(admin, bookingId)
  if (!booking) return { status: 'skipped', reason: 'not_found' }
  if (!options?.force && booking.fully_paid_email_sent_at) return { status: 'skipped', reason: 'already_sent' }

  const payload = getFullyPaidPayloadFromBooking(booking)
  if (!payload) return { status: 'skipped', reason: 'not_ready' }

  const result = await sendBookingFullyPaidNotification(payload)
  if (!result.ok) return { status: 'failed', detail: result.detail || 'Unable to send fully paid email.' }

  if (!booking.fully_paid_email_sent_at) {
    await stampBookingEmail(admin, bookingId, 'fully_paid_email_sent_at', options?.nowIso ?? new Date().toISOString())
  }
  await appendBookingTimelineNote(admin, bookingId, getFullyPaidNote(payload.email, options?.mode ?? 'auto'))
  return { status: 'sent', email: payload.email }
}

export async function sendBookingPostEventFollowUpEmail(admin: AdminClient, bookingId: string, options?: { force?: boolean; nowIso?: string; mode?: BookingEmailMode }): Promise<DispatchResult> {
  const booking = await getPostEventFollowUpSource(admin, bookingId)
  if (!booking) return { status: 'skipped', reason: 'not_found' }
  if (!options?.force && booking.post_event_follow_up_sent_at) return { status: 'skipped', reason: 'already_sent' }

  const payload = getPostEventFollowUpPayloadFromBooking(booking)
  if (!payload) return { status: 'skipped', reason: 'not_ready' }

  const result = await sendBookingPostEventFollowUp(payload)
  if (!result.ok) return { status: 'failed', detail: result.detail || 'Unable to send post-event follow-up email.' }

  if (!booking.post_event_follow_up_sent_at) {
    await stampBookingEmail(admin, bookingId, 'post_event_follow_up_sent_at', options?.nowIso ?? new Date().toISOString())
  }
  await appendBookingTimelineNote(admin, bookingId, getPostEventFollowUpNote(payload.email, options?.mode ?? 'auto'))
  return { status: 'sent', email: payload.email }
}
