import { getOutstandingBalance, getReceivedPaymentTotal } from '@/lib/booking-finance'

type PaymentLike = {
  amount: number
  status: 'pending' | 'received' | 'refunded'
}

export type BookingPaymentStatus = 'paid' | 'partial' | 'unpaid'

export function getBookingPaymentStatus(
  totalQuote: number | null | undefined,
  payments: Array<PaymentLike> | null | undefined
): BookingPaymentStatus {
  const receivedTotal = getReceivedPaymentTotal(payments)

  if (receivedTotal <= 0) return 'unpaid'
  if (getOutstandingBalance(totalQuote, payments) <= 0) return 'paid'
  return 'partial'
}
