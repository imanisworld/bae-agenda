import { getDepositConfirmedVia, getDepositPaidAt, getDepositStatus, type DepositConfirmedVia, type DepositSnapshotStatus } from '@/lib/booking-deposit'

type PaymentRow = {
  amount: number
  type: 'deposit' | 'balance' | 'full' | 'refund'
  status: 'pending' | 'received' | 'refunded'
  method: string | null
  paid_at: string | null
}

type BookingDepositRow = {
  deposit_amount: number | null
  payments: PaymentRow[] | null
}

// The admin client is created with `any` in lib/supabase/admin.ts to avoid deeply-recursive
// Supabase relationship typings in server-only code paths. Keep this helper aligned.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncBookingDepositState(admin: any, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select('deposit_amount, payments(amount, type, status, method, paid_at)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[deposit-sync] unable to load booking deposit state:', error?.message ?? error)
    return {
      depositStatus: 'unpaid' as DepositSnapshotStatus,
      depositPaidAt: null,
      depositConfirmedVia: null as DepositConfirmedVia,
      updated: false,
    }
  }

  const booking = data as BookingDepositRow
  const depositStatus = getDepositStatus(booking.deposit_amount, booking.payments)
  const depositPaidAt = getDepositPaidAt(booking.deposit_amount, booking.payments)
  const depositConfirmedVia = getDepositConfirmedVia(booking.deposit_amount, booking.payments)

  const { error: updateError } = await admin
    .from('bookings')
    .update({
      deposit_status: depositStatus,
      deposit_paid_at: depositPaidAt,
      deposit_confirmed_via: depositConfirmedVia,
    })
    .eq('id', bookingId)

  if (updateError) {
    const detail = updateError.message ?? String(updateError)
    if (detail.includes('column bookings.deposit_status does not exist')) {
      return { depositStatus, depositPaidAt, depositConfirmedVia, updated: false }
    }
    console.error('[deposit-sync] unable to update booking deposit state:', updateError.message ?? updateError)
    return { depositStatus, depositPaidAt, depositConfirmedVia, updated: false }
  }

  return { depositStatus, depositPaidAt, depositConfirmedVia, updated: true }
}
