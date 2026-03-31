import { describe, expect, it } from 'vitest'
import {
  getBookingLifecycleStatus,
  getBookingWorkflowPaymentStatus,
  mapLegacyBookingStatusToLifecycleStatus,
  mapLifecycleStatusToLegacyBookingStatus,
} from './booking-workflow'

describe('booking workflow helpers', () => {
  it('maps legacy booking statuses into lifecycle statuses', () => {
    expect(mapLegacyBookingStatusToLifecycleStatus('inquiry')).toBe('new')
    expect(mapLegacyBookingStatusToLifecycleStatus('confirmed')).toBe('confirmed')
    expect(mapLegacyBookingStatusToLifecycleStatus('completed')).toBe('completed')
    expect(mapLegacyBookingStatusToLifecycleStatus('cancelled')).toBe('lost')
  })

  it('maps lifecycle statuses back to legacy booking statuses for compatibility', () => {
    expect(mapLifecycleStatusToLegacyBookingStatus('new')).toBe('inquiry')
    expect(mapLifecycleStatusToLegacyBookingStatus('contacted')).toBe('inquiry')
    expect(mapLifecycleStatusToLegacyBookingStatus('negotiating')).toBe('inquiry')
    expect(mapLifecycleStatusToLegacyBookingStatus('confirmed')).toBe('confirmed')
    expect(mapLifecycleStatusToLegacyBookingStatus('completed')).toBe('completed')
    expect(mapLifecycleStatusToLegacyBookingStatus('lost')).toBe('cancelled')
  })

  it('prefers the explicit lifecycle status when present', () => {
    expect(getBookingLifecycleStatus('contacted', 'inquiry')).toBe('contacted')
  })

  it('marks confirmed unpaid bookings as deposit requested', () => {
    expect(getBookingWorkflowPaymentStatus({
      quote: 1200,
      depositAmount: 300,
      lifecycleStatus: 'confirmed',
      payments: [],
    })).toBe('deposit_requested')
  })

  it('marks deposit covered bookings as deposit paid', () => {
    expect(getBookingWorkflowPaymentStatus({
      currentStatus: 'deposit_requested',
      quote: 1200,
      depositAmount: 300,
      lifecycleStatus: 'confirmed',
      payments: [{ amount: 300, type: 'deposit', status: 'received' }],
    })).toBe('deposit_paid')
  })

  it('preserves balance requested until the booking is fully paid', () => {
    expect(getBookingWorkflowPaymentStatus({
      currentStatus: 'balance_requested',
      quote: 1200,
      depositAmount: 300,
      lifecycleStatus: 'confirmed',
      payments: [{ amount: 300, type: 'deposit', status: 'received' }],
    })).toBe('balance_requested')
  })

  it('marks fully paid bookings as paid', () => {
    expect(getBookingWorkflowPaymentStatus({
      currentStatus: 'balance_requested',
      quote: 1200,
      depositAmount: 300,
      lifecycleStatus: 'confirmed',
      payments: [
        { amount: 300, type: 'deposit', status: 'received' },
        { amount: 900, type: 'balance', status: 'received' },
      ],
    })).toBe('paid')
  })
})
