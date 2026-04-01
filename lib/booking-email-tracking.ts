import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export type BookingEmailStampColumn =
  | 'inquiry_receipt_sent_at'
  | 'confirmation_email_sent_at'
  | 'last_balance_reminder_sent_at'
  | 'post_event_follow_up_sent_at'
  | 'review_request_sent_at'

export async function stampBookingEmailSentAt(
  admin: AdminClient,
  bookingId: string,
  column: BookingEmailStampColumn,
  sentAt = new Date().toISOString(),
) {
  const { error } = await admin
    .from('bookings')
    .update({ [column]: sentAt })
    .eq('id', bookingId)

  if (error) {
    console.error('[booking-email-tracking] sent-at stamp failed:', column, error.message)
    return false
  }

  return true
}
