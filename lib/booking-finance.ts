import type { PaymentStatus } from '@/types/index'

type PaymentLike = {
  amount: number
  status: PaymentStatus
}

export function getReceivedPaymentTotal(payments: Array<PaymentLike> | null | undefined) {
  return (payments ?? [])
    .filter((payment) => payment.status === 'received')
    .reduce((sum, payment) => sum + payment.amount, 0)
}

export function getOutstandingDeposit(
  depositAmount: number | null | undefined,
  payments: Array<PaymentLike> | null | undefined
) {
  return Math.max((depositAmount ?? 0) - getReceivedPaymentTotal(payments), 0)
}

export function getOutstandingBalance(
  totalQuote: number | null | undefined,
  payments: Array<PaymentLike> | null | undefined
) {
  return Math.max((totalQuote ?? 0) - getReceivedPaymentTotal(payments), 0)
}
