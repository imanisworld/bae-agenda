import { describe, expect, it } from 'vitest'
import {
  balanceDueOf,
  formatInvoiceDueDate,
  invoiceFilename,
  invoiceLineItemsTotal,
  invoiceNumberOf,
  normalizeInvoiceLineItems,
  type InvoiceBookingData,
} from './invoices'

const booking: InvoiceBookingData = {
  id: 'c2ef72b0-629e-4fb8-8830-0a5c380f888e',
  event_name: 'House Music Brunch',
  event_type: 'Brunch',
  event_date: '2026-07-04T22:30:00.000Z',
  event_end_time: '2026-07-05T00:00:00.000Z',
  event_timezone: 'America/Indiana/Indianapolis',
  venue: 'Canal Bistro',
  city: 'Indianapolis, IN',
  package: '2 Hour Set',
  hours: 2,
  quote: 1200,
  deposit_amount: 300,
  notes: null,
  clients: {
    first_name: 'Imani',
    last_name: 'Crumble',
    email: 'client@example.com',
    phone: '555-111-2222',
  },
}

describe('invoice helpers', () => {
  it('builds a predictable invoice filename', () => {
    expect(invoiceFilename(booking)).toBe('invoice-imani-crumble-c2ef72b0.pdf')
  })

  it('uses the booking id prefix as the invoice number', () => {
    expect(invoiceNumberOf(booking)).toBe('C2EF72B0')
  })

  it('computes the remaining balance from quote minus deposit', () => {
    expect(balanceDueOf(booking)).toBe(900)
  })

  it('normalizes multiple invoice line items and totals them', () => {
    const items = normalizeInvoiceLineItems([
      { description: 'DJ set', quantity: 2, unit_amount: 400 },
      { description: 'Travel', quantity: 1, unit_amount: 125.5 },
    ])

    expect(items).toEqual([
      { description: 'DJ set', quantity: 2, unit_amount: 400 },
      { description: 'Travel', quantity: 1, unit_amount: 125.5 },
    ])
    expect(invoiceLineItemsTotal(items)).toBe(925.5)
  })

  it('falls back to one service line when stored line items are invalid', () => {
    expect(normalizeInvoiceLineItems(null, 'House Music Brunch', 1200)).toEqual([
      { description: 'House Music Brunch', quantity: 1, unit_amount: 1200 },
    ])
  })

  it('formats a date-only invoice due date without timezone drift', () => {
    expect(formatInvoiceDueDate('2026-07-04')).toBe('July 4, 2026')
  })
})
