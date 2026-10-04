// Bookings made from an event's "Invoice this event" button bill a venue or
// promoter, not a party client. They're marked by event type so the daily
// reminder job leaves them alone; invoices and reminders are sent by hand.
export const EVENT_INVOICE_EVENT_TYPE = 'Venue / promoter gig'

export function isEventInvoiceBooking(eventType: string | null | undefined) {
  return eventType?.trim() === EVENT_INVOICE_EVENT_TYPE
}

/** Due date for an event invoice: the event day, or two weeks out if the event has passed. */
export function eventInvoiceDueDate(eventDueDate: string | null, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  if (eventDueDate && eventDueDate >= today) return eventDueDate

  const due = new Date(now)
  due.setUTCDate(due.getUTCDate() + 14)
  return due.toISOString().slice(0, 10)
}
