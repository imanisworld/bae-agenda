import { describe, expect, it } from 'vitest'
import { getInvoicePaidStamp } from './invoices'

describe('invoice paid stamp', () => {
  it('stamps when received payments cover the total, using the latest date and each method', () => {
    expect(getInvoicePaidStamp([
      { amount: 100, status: 'received', method: 'zelle', paid_at: '2026-05-01T12:00:00Z' },
      { amount: 200, status: 'received', method: 'cash', paid_at: '2026-05-17T12:00:00Z' },
    ], 300)).toEqual({ paidAt: '2026-05-17T12:00:00Z', methods: ['zelle', 'cash'] })
  })

  it('does not stamp while a balance is open or payments are only pending', () => {
    expect(getInvoicePaidStamp([{ amount: 100, status: 'received' }], 300)).toBeNull()
    expect(getInvoicePaidStamp([{ amount: 300, status: 'pending' }], 300)).toBeNull()
    expect(getInvoicePaidStamp([], 0)).toBeNull()
  })
})
