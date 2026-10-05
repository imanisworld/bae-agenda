import { getBookingLifecycleStatus, getBookingWorkflowPaymentStatus, type BookingLifecycleStatus, type BookingWorkflowPaymentStatus } from '@/lib/booking-workflow'
import type { BookingStatus } from '@/types/index'

type PaymentLike = {
  amount: number
  type?: string | null
  status: 'pending' | 'received' | 'refunded'
}

type BookingPaymentStateRow = {
  status: BookingStatus
  lifecycle_status: BookingLifecycleStatus | null
  quote: number | null
  deposit_amount: number | null
  last_balance_reminder_sent_at: string | null
  payments: PaymentLike[] | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncComputedBookingPaymentState(admin: any, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select('status, lifecycle_status, quote, deposit_amount, last_balance_reminder_sent_at, payments(amount, type, status)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[booking-payment-sync] unable to load booking:', error?.message ?? error)
    return null
  }

  const booking = data as BookingPaymentStateRow
  const lifecycleStatus = getBookingLifecycleStatus(booking.lifecycle_status, booking.status)
  const paymentStatus = getBookingWorkflowPaymentStatus({
    quote: booking.quote,
    depositAmount: booking.deposit_amount,
    lifecycleStatus,
    payments: booking.payments,
    lastBalanceReminderSentAt: booking.last_balance_reminder_sent_at,
  })

  const { error: updateError } = await admin
    .from('bookings')
    .update({
      payment_status: paymentStatus,
      balance_paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', bookingId)

  if (updateError) {
    console.error('[booking-payment-sync] unable to update booking:', updateError.message ?? updateError)
    return null
  }

  // Keep the invoice in step with the money: paid bookings show a paid invoice,
  // and a refund that reopens the balance puts it back to sent.
  const invoiceUpdate = paymentStatus === 'paid'
    ? admin.from('invoices').update({ status: 'paid' }).eq('booking_id', bookingId).in('status', ['draft', 'sent'])
    : admin.from('invoices').update({ status: 'sent' }).eq('booking_id', bookingId).eq('status', 'paid')
  const { error: invoiceError } = await invoiceUpdate
  if (invoiceError) {
    console.error('[booking-payment-sync] unable to update invoice status:', invoiceError.message ?? invoiceError)
  }

  return { lifecycleStatus, paymentStatus: paymentStatus as BookingWorkflowPaymentStatus }
}
