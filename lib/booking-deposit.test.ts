import { describe, expect, it } from 'vitest'
import { formatPaymentMethodLabel, getDepositConfirmedVia, getDepositPaidAt, getDepositStatus } from '@/lib/booking-deposit'

describe('booking deposit helpers', () => {
  it('marks the deposit unpaid when nothing has been received yet', () => {
    expect(getDepositStatus(300, null)).toBe('unpaid')
  })

  it('marks the deposit pending when a pending deposit payment exists', () => {
    expect(getDepositStatus(300, [{ amount: 300, type: 'deposit', status: 'pending' }])).toBe('pending')
  })

  it('marks the deposit paid once received payments cover the target', () => {
    const payments = [
      { amount: 150, type: 'deposit', status: 'received', method: 'zelle', paid_at: '2026-03-30T10:00:00.000Z' },
      { amount: 150, type: 'deposit', status: 'received', method: 'stripe', paid_at: '2026-03-30T11:00:00.000Z' },
    ] as const

    expect(getDepositStatus(300, payments as unknown as Array<{ amount: number; type: 'deposit'; status: 'received'; method: string; paid_at: string }>)).toBe('paid')
    expect(getDepositConfirmedVia(300, payments as unknown as Array<{ amount: number; type: 'deposit'; status: 'received'; method: string; paid_at: string }>)).toBe('stripe')
    expect(getDepositPaidAt(300, payments as unknown as Array<{ amount: number; type: 'deposit'; status: 'received'; method: string; paid_at: string }>)).toBe('2026-03-30T11:00:00.000Z')
  })

  it('formats cash app cleanly for the UI', () => {
    expect(formatPaymentMethodLabel('cash_app')).toBe('Cash App')
    expect(formatPaymentMethodLabel('ach')).toBe('ACH')
  })
})
