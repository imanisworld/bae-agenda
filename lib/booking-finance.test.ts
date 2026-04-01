import { describe, expect, it } from 'vitest'
import { getBookingFinancialSnapshot, getOutstandingBalance, getOutstandingDeposit, getReceivedPaymentTotal } from './booking-finance'

describe('booking finance helpers', () => {
  const payments = [
    { amount: 200, status: 'received' as const },
    { amount: 150, status: 'pending' as const },
    { amount: 100, status: 'received' as const },
  ]

  it('totals only received payments', () => {
    expect(getReceivedPaymentTotal(payments)).toBe(300)
  })

  it('computes outstanding deposit against received payments only', () => {
    expect(getOutstandingDeposit(500, payments)).toBe(200)
  })

  it('never returns a negative outstanding deposit', () => {
    expect(getOutstandingDeposit(250, payments)).toBe(0)
  })

  it('computes outstanding balance against received payments only', () => {
    expect(getOutstandingBalance(1200, payments)).toBe(900)
  })

  it('treats null values as zero safely', () => {
    expect(getReceivedPaymentTotal(null)).toBe(0)
    expect(getOutstandingDeposit(null, null)).toBe(0)
    expect(getOutstandingBalance(undefined, undefined)).toBe(0)
  })

  it('returns a deterministic booking finance snapshot', () => {
    expect(getBookingFinancialSnapshot({
      totalDue: 1200,
      depositAmount: 300,
      payments,
    })).toEqual({
      totalDue: 1200,
      totalPaid: 300,
      remainingBalance: 900,
      remainingDeposit: 0,
    })
  })
})
