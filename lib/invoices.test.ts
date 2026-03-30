import { describe, expect, it } from 'vitest'
import { balanceDueOf, invoiceFilename, invoiceNumberOf, type InvoiceBookingData } from './invoices'

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
})
