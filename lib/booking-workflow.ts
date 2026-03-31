import { getOutstandingBalance, getOutstandingDeposit, getReceivedPaymentTotal } from '@/lib/booking-finance'

export type BookingLifecycleStatus =
  | 'new'
  | 'contacted'
  | 'negotiating'
  | 'confirmed'
  | 'completed'
  | 'lost'

export type BookingWorkflowPaymentStatus =
  | 'unpaid'
  | 'deposit_requested'
  | 'deposit_paid'
  | 'balance_requested'
  | 'paid'

type LegacyBookingStatus = 'inquiry' | 'confirmed' | 'completed' | 'cancelled'

type PaymentLike = {
  amount: number
  type?: string | null
  status: 'pending' | 'received' | 'refunded'
}

export function mapLegacyBookingStatusToLifecycleStatus(
  status: LegacyBookingStatus | null | undefined,
): BookingLifecycleStatus {
  switch (status) {
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'lost'
    default:
      return 'new'
  }
}

export function mapLifecycleStatusToLegacyBookingStatus(
  status: BookingLifecycleStatus,
): LegacyBookingStatus {
  switch (status) {
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'lost':
      return 'cancelled'
    default:
      return 'inquiry'
  }
}

export function getBookingLifecycleStatus(
  lifecycleStatus: BookingLifecycleStatus | null | undefined,
  legacyStatus: LegacyBookingStatus | null | undefined,
): BookingLifecycleStatus {
  return lifecycleStatus ?? mapLegacyBookingStatusToLifecycleStatus(legacyStatus)
}

export function getBookingWorkflowPaymentStatus(args: {
  currentStatus?: BookingWorkflowPaymentStatus | null
  quote: number | null | undefined
  depositAmount: number | null | undefined
  lifecycleStatus?: BookingLifecycleStatus | null
  payments: Array<PaymentLike> | null | undefined
}): BookingWorkflowPaymentStatus {
  const currentStatus = args.currentStatus ?? 'unpaid'
  const quote = args.quote ?? 0
  const depositAmount = args.depositAmount ?? 0
  const lifecycleStatus = args.lifecycleStatus ?? 'new'
  const payments = args.payments ?? null
  const receivedTotal = getReceivedPaymentTotal(payments)
  const outstandingBalance = getOutstandingBalance(quote, payments)
  const outstandingDeposit = getOutstandingDeposit(depositAmount, payments)

  if (quote > 0 && outstandingBalance <= 0 && receivedTotal > 0) {
    return 'paid'
  }

  if (depositAmount > 0 && outstandingDeposit <= 0) {
    if (currentStatus === 'balance_requested') {
      return 'balance_requested'
    }
    return 'deposit_paid'
  }

  if (currentStatus === 'balance_requested') {
    return 'balance_requested'
  }

  if (currentStatus === 'deposit_requested') {
    return 'deposit_requested'
  }

  if (lifecycleStatus === 'confirmed' && depositAmount > 0) {
    return 'deposit_requested'
  }

  return 'unpaid'
}
