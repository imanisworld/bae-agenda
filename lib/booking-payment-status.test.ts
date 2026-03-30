import { describe, expect, it } from 'vitest'
import { getBookingPaymentStatus } from './booking-payment-status'

describe('booking payment status helpers', () => {
  it('returns unpaid when nothing has been received yet', () => {
    expect(getBookingPaymentStatus(1200, null)).toBe('unpaid')
    expect(getBookingPaymentStatus(1200, [{ amount: 400, status: 'pending' }])).toBe('unpaid')
  })

  it('returns partial when some money is received but a balance remains', () => {
    expect(getBookingPaymentStatus(1200, [{ amount: 300, status: 'received' }])).toBe('partial')
  })

  it('returns paid when received payments cover the quote', () => {
    expect(getBookingPaymentStatus(1200, [{ amount: 1200, status: 'received' }])).toBe('paid')
    expect(getBookingPaymentStatus(1200, [{ amount: 1500, status: 'received' }])).toBe('paid')
  })
})
