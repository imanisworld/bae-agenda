import { describe, expect, it } from 'vitest'
import { nextInvoiceNumberFrom } from './invoice-numbers'

describe('invoice numbers', () => {
  it('starts at BAE-1001', () => {
    expect(nextInvoiceNumberFrom([])).toBe('BAE-1001')
  })

  it('counts up from the highest number, ignoring older id-style numbers', () => {
    expect(nextInvoiceNumberFrom(['BAE-1001', '3F2A9C1B', 'BAE-1009', 'BAE-1002', null])).toBe('BAE-1010')
  })
})
