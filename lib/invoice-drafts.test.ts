import { describe, expect, it } from 'vitest'
import { buildInvoiceDraftRecord, type InvoiceDraftSource } from './invoice-drafts'

const booking: InvoiceDraftSource = {
  id: 'c2ef72b0-629e-4fb8-8830-0a5c380f888e',
  status: 'confirmed',
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

describe('invoice draft helpers', () => {
  it('builds a draft invoice record from a confirmed booking', () => {
    expect(buildInvoiceDraftRecord(booking)).toEqual({
      booking_id: booking.id,
      status: 'draft',
      invoice_number: 'C2EF72B0',
      pdf_filename: 'invoice-imani-crumble-c2ef72b0.pdf',
      event_name: 'House Music Brunch',
      client_name: 'Imani Crumble',
      client_email: 'client@example.com',
      total_amount: 1200,
      deposit_amount: 300,
      balance_due: 900,
      due_date: '2026-07-04',
      payment_terms: 'Balance due on or before the event date. Deposit is non-refundable. Final balance must be paid before the event.',
      line_items: [
        {
          description: 'House Music Brunch',
          quantity: 1,
          unit_amount: 1200,
        },
      ],
    })
  })

  it('falls back safely when quote, deposit, or client name are missing', () => {
    expect(buildInvoiceDraftRecord({
      ...booking,
      quote: null,
      deposit_amount: null,
      clients: { first_name: null, last_name: null, email: null, phone: null },
    })).toMatchObject({
      client_name: 'Client',
      client_email: null,
      total_amount: 0,
      deposit_amount: 0,
      balance_due: 0,
      line_items: [
        {
          description: 'House Music Brunch',
          quantity: 1,
          unit_amount: 0,
        },
      ],
    })
  })
})
