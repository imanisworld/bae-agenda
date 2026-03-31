import { getPostEventFollowUpPayloadFromBooking, type BookingPostEventFollowUpSource } from '@/lib/booking-email-payloads'
import { stampBookingEmailSentAt } from '@/lib/booking-email-tracking'
import { sendBookingPostEventFollowUp } from '@/lib/notifications'
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

export async function sendBookingPostEventFollowUpEmail(admin: AdminClient, bookingId: string, options?: { force?: boolean; nowIso?: string; mode?: BookingEmailMode }): Promise<DispatchResult> {
  const booking = await getPostEventFollowUpSource(admin, bookingId)
  if (!booking) return { status: 'skipped', reason: 'not_found' }
  if (!options?.force && booking.post_event_follow_up_sent_at) return { status: 'skipped', reason: 'already_sent' }

  const payload = getPostEventFollowUpPayloadFromBooking(booking)
  if (!payload) return { status: 'skipped', reason: 'not_ready' }

  const result = await sendBookingPostEventFollowUp(payload)
  if (!result.ok) return { status: 'failed', detail: result.detail || 'Unable to send post-event follow-up email.' }

  if (!booking.post_event_follow_up_sent_at) {
    await stampBookingEmailSentAt(admin, bookingId, 'post_event_follow_up_sent_at', options?.nowIso ?? new Date().toISOString())
  }
  await appendBookingTimelineNote(admin, bookingId, getPostEventFollowUpNote(payload.email, options?.mode ?? 'auto'))
  return { status: 'sent', email: payload.email }
}
