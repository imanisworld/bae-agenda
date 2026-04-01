import type { PaymentStatus } from '@/types/index'

type PaymentLike = {
  amount: number
  status: PaymentStatus
}

export interface BookingFinancialSnapshot {
  totalDue: number
  totalPaid: number
  remainingBalance: number
  remainingDeposit: number
}

export function getReceivedPaymentTotal(payments: Array<PaymentLike> | null | undefined) {
  return (payments ?? [])
    .filter((payment) => payment.status === 'received')
    .reduce((sum, payment) => sum + payment.amount, 0)
}

export function getBookingFinancialSnapshot(args: {
  totalDue: number | null | undefined
  depositAmount?: number | null | undefined
  payments: Array<PaymentLike> | null | undefined
}): BookingFinancialSnapshot {
  const totalDue = Math.max(args.totalDue ?? 0, 0)
  const totalPaid = getReceivedPaymentTotal(args.payments)
  const remainingBalance = Math.max(totalDue - totalPaid, 0)
  const remainingDeposit = Math.max((args.depositAmount ?? 0) - totalPaid, 0)

  return {
    totalDue,
    totalPaid,
    remainingBalance,
    remainingDeposit,
  }
}

export function getOutstandingDeposit(
  depositAmount: number | null | undefined,
  payments: Array<PaymentLike> | null | undefined
) {
  return getBookingFinancialSnapshot({
    totalDue: 0,
    depositAmount,
    payments,
  }).remainingDeposit
}

export function getOutstandingBalance(
  totalQuote: number | null | undefined,
  payments: Array<PaymentLike> | null | undefined
) {
  return getBookingFinancialSnapshot({
    totalDue: totalQuote,
    payments,
  }).remainingBalance
}
