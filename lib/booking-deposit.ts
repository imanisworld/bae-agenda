import { getReceivedPaymentTotal } from '@/lib/booking-finance'

export type DepositSnapshotStatus = 'unpaid' | 'pending' | 'paid'
export type DepositConfirmedVia = 'stripe' | 'manual' | null

type DepositPaymentLike = {
  amount: number
  type: 'deposit' | 'balance' | 'full' | 'refund' | string
  status: 'pending' | 'received' | 'refunded'
  method?: string | null
  paid_at?: string | null
}

function getPendingDepositPayment(payments: Array<DepositPaymentLike> | null | undefined) {
  return (payments ?? []).some((payment) => {
    if (payment.status !== 'pending') return false
    return payment.type === 'deposit' || payment.type === 'full'
  })
}

export function getDepositStatus(
  depositAmount: number | null | undefined,
  payments: Array<DepositPaymentLike> | null | undefined
): DepositSnapshotStatus {
  if (depositAmount === null || depositAmount === undefined) {
    return 'unpaid'
  }

  const due = depositAmount

  if (due <= 0) return 'paid'
  if (getReceivedPaymentTotal(payments) >= due) return 'paid'
  if (getPendingDepositPayment(payments)) return 'pending'
  return 'unpaid'
}

export function getDepositConfirmedVia(
  depositAmount: number | null | undefined,
  payments: Array<DepositPaymentLike> | null | undefined
): DepositConfirmedVia {
  if (getDepositStatus(depositAmount, payments) !== 'paid') {
    return null
  }

  const latestReceived = [...(payments ?? [])]
    .filter((payment) => payment.status === 'received')
    .sort((a, b) => {
      const aTime = a.paid_at ? new Date(a.paid_at).getTime() : 0
      const bTime = b.paid_at ? new Date(b.paid_at).getTime() : 0
      return bTime - aTime
    })[0]

  if (!latestReceived?.method) {
    return 'manual'
  }

  return latestReceived.method === 'stripe' ? 'stripe' : 'manual'
}

export function getDepositPaidAt(
  depositAmount: number | null | undefined,
  payments: Array<DepositPaymentLike> | null | undefined
) {
  if (getDepositStatus(depositAmount, payments) !== 'paid') {
    return null
  }

  const latestReceivedTimestamp = [...(payments ?? [])]
    .filter((payment) => payment.status === 'received' && payment.paid_at)
    .sort((a, b) => new Date(b.paid_at as string).getTime() - new Date(a.paid_at as string).getTime())[0]

  return latestReceivedTimestamp?.paid_at ?? null
}

export function formatPaymentMethodLabel(method: string | null | undefined) {
  if (!method) return '—'
  if (method === 'ach') return 'ACH'
  if (method === 'cash_app') return 'Cash App'
  return method
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
