import { describe, expect, it } from 'vitest'
import { EVENT_INVOICE_EVENT_TYPE, eventInvoiceDueDate, isEventInvoiceBooking } from './event-invoice'

describe('event invoices', () => {
  it('recognises only the event-invoice booking type', () => {
    expect(isEventInvoiceBooking(EVENT_INVOICE_EVENT_TYPE)).toBe(true)
    expect(isEventInvoiceBooking(` ${EVENT_INVOICE_EVENT_TYPE} `)).toBe(true)
    expect(isEventInvoiceBooking('Club / Venue Night')).toBe(false)
    expect(isEventInvoiceBooking(null)).toBe(false)
  })

  it('keeps an upcoming event day as the due date', () => {
    expect(eventInvoiceDueDate('2026-10-16', new Date('2026-10-04T12:00:00Z'))).toBe('2026-10-16')
  })

  it('gives past events two weeks from today', () => {
    expect(eventInvoiceDueDate('2026-06-25', new Date('2026-10-04T12:00:00Z'))).toBe('2026-10-18')
    expect(eventInvoiceDueDate(null, new Date('2026-10-04T12:00:00Z'))).toBe('2026-10-18')
  })
})
