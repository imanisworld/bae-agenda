import {
  getPostEventFollowUpPayloadFromBooking,
  getReviewRequestPayloadFromBooking,
  type BookingPostEventFollowUpSource,
  type BookingReviewRequestSource,
} from '@/lib/booking-email-payloads'
import { stampBookingEmailSentAt } from '@/lib/booking-email-tracking'
import { sendBookingPostEventFollowUp, sendBookingReviewRequest } from '@/lib/notifications'
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

function getPostEventFollowUpNote(email: string, mode: BookingEmailMode) {
  if (mode === 'resend') return `Post-event follow-up email resent to ${email}.`
  if (mode === 'scheduled') return `Scheduled post-event follow-up email sent to ${email}.`
  return `Post-event follow-up email sent to ${email} after the booking was completed.`
}

function getReviewRequestNote(email: string, mode: BookingEmailMode) {
  if (mode === 'resend') return `Review request email resent to ${email}.`
  if (mode === 'scheduled') return `Scheduled review request email sent to ${email}.`
  return `Review request email sent to ${email}.`
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

async function getReviewRequestSource(admin: AdminClient, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      event_name,
      event_date,
      event_timezone,
      review_request_sent_at,
      clients(first_name, last_name, email)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) return null
  return data as BookingReviewRequestSource & { review_request_sent_at: string | null }
}

export async function sendBookingPostEventFollowUpEmail(
  admin: AdminClient,
  bookingId: string,
  options?: { force?: boolean; nowIso?: string; mode?: BookingEmailMode; idempotencyKey?: string }
): Promise<DispatchResult> {
  const booking = await getPostEventFollowUpSource(admin, bookingId)
  if (!booking) return { status: 'skipped', reason: 'not_found' }
  if (!options?.force && booking.post_event_follow_up_sent_at) return { status: 'skipped', reason: 'already_sent' }

  const payload = getPostEventFollowUpPayloadFromBooking(booking)
  if (!payload) return { status: 'skipped', reason: 'not_ready' }

  const result = await sendBookingPostEventFollowUp(payload, {
    idempotencyKey: options?.idempotencyKey ?? (options?.force ? undefined : `booking-post-event-${bookingId}`),
  })
  if (!result.ok) return { status: 'failed', detail: result.detail || 'Unable to send post-event follow-up email.' }

  if (!booking.post_event_follow_up_sent_at) {
    await stampBookingEmailSentAt(admin, bookingId, 'post_event_follow_up_sent_at', options?.nowIso ?? new Date().toISOString())
  }
  await appendBookingTimelineNote(admin, bookingId, getPostEventFollowUpNote(payload.email, options?.mode ?? 'auto'))
  return { status: 'sent', email: payload.email }
}

export async function sendBookingReviewRequestEmail(
  admin: AdminClient,
  bookingId: string,
  options?: { force?: boolean; nowIso?: string; mode?: BookingEmailMode; idempotencyKey?: string }
): Promise<DispatchResult> {
  const booking = await getReviewRequestSource(admin, bookingId)
  if (!booking) return { status: 'skipped', reason: 'not_found' }
  if (!options?.force && booking.review_request_sent_at) return { status: 'skipped', reason: 'already_sent' }

  const payload = getReviewRequestPayloadFromBooking(booking)
  if (!payload) return { status: 'skipped', reason: 'not_ready' }

  const result = await sendBookingReviewRequest(payload, {
    idempotencyKey: options?.idempotencyKey ?? (options?.force ? undefined : `booking-review-request-${bookingId}`),
  })
  if (!result.ok) return { status: 'failed', detail: result.detail || 'Unable to send review request email.' }

  if (!booking.review_request_sent_at) {
    await stampBookingEmailSentAt(admin, bookingId, 'review_request_sent_at', options?.nowIso ?? new Date().toISOString())
  }
  await appendBookingTimelineNote(admin, bookingId, getReviewRequestNote(payload.email, options?.mode ?? 'auto'))
  return { status: 'sent', email: payload.email }
}
