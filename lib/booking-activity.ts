import { createAdminClient } from '@/lib/supabase/admin'

export type BookingActivityType =
  | 'status_changed'
  | 'payment_status_changed'
  | 'email_sent'
  | 'payment_recorded'
  | 'note_added'
  | 'portal_request'
  | 'booking_created'

export interface LogBookingActivityArgs {
  bookingId: string
  type: BookingActivityType
  description: string
  metadata?: Record<string, unknown>
}

export async function logBookingActivity({
  bookingId,
  type,
  description,
  metadata,
}: LogBookingActivityArgs): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('booking_activity').insert({
    booking_id: bookingId,
    type,
    description,
    metadata: metadata ?? null,
  })
  // intentionally fire-and-forget — never throw, never block a transition
}
