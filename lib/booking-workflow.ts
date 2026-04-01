import { getBookingFinancialSnapshot } from '@/lib/booking-finance'

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

const VALID_LIFECYCLE_TRANSITIONS: Record<BookingLifecycleStatus, BookingLifecycleStatus[]> = {
  new:          ['contacted', 'lost'],
  contacted:    ['negotiating', 'lost'],
  negotiating:  ['confirmed', 'lost'],
  confirmed:    ['completed', 'lost'],
  completed:    [],
  lost:         [],
}

export function assertValidLifecycleTransition(
  from: BookingLifecycleStatus,
  to: BookingLifecycleStatus,
): void {
  const allowed = VALID_LIFECYCLE_TRANSITIONS[from]
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid lifecycle transition: ${from} → ${to}. Allowed from ${from}: ${allowed.join(', ') || 'none'}`,
    )
  }
}

export function getBookingWorkflowPaymentStatus(args: {
  quote: number | null | undefined
  depositAmount: number | null | undefined
  lifecycleStatus?: BookingLifecycleStatus | null
  payments: Array<PaymentLike> | null | undefined
  lastBalanceReminderSentAt?: string | null | undefined
}): BookingWorkflowPaymentStatus {
  const lifecycleStatus = args.lifecycleStatus ?? 'new'
  const { totalPaid, remainingBalance, remainingDeposit } = getBookingFinancialSnapshot({
    totalDue: args.quote,
    depositAmount: args.depositAmount,
    payments: args.payments ?? null,
  })

  if (remainingBalance <= 0 && totalPaid > 0) {
    return 'paid'
  }

  if ((args.depositAmount ?? 0) > 0 && remainingDeposit > 0) {
    if (lifecycleStatus === 'confirmed' || lifecycleStatus === 'completed') {
      return 'deposit_requested'
    }
    return 'unpaid'
  }

  if (remainingBalance > 0 && totalPaid > 0) {
    if (args.lastBalanceReminderSentAt) {
      return 'balance_requested'
    }
    return 'deposit_paid'
  }

  if (remainingBalance > 0 && args.lastBalanceReminderSentAt) {
    return 'balance_requested'
  }

  return 'unpaid'
}
