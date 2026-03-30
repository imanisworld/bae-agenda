import { describe, expect, it } from 'vitest'
import {
  getBalanceReminderPayloadFromBooking,
  getConfirmationPayloadFromBooking,
  getDepositReminderPayloadFromBooking,
  getEventReminderPayloadFromBooking,
  getInquiryReceiptPayloadFromBooking,
  type BookingBalanceReminderSource,
  type BookingConfirmationSource,
  type BookingDepositReminderSource,
  type BookingEventReminderSource,
  type BookingInquiryReceiptSource,
} from './booking-email-payloads'

const baseClient = [{ first_name: 'Imani', last_name: 'Crumble', email: 'client@example.com' }]
const eventDate = '2026-07-04T22:30:00.000Z'
const eventTimeZone = 'America/Indiana/Indianapolis'

describe('booking email payload helpers', () => {
  it('builds the confirmation payload when required fields are present', () => {
    const booking: BookingConfirmationSource = {
      id: 'booking-1',
      status: 'confirmed',
      event_name: 'House Music Brunch',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
      clients: baseClient,
    }

    expect(getConfirmationPayloadFromBooking(booking)).toEqual({
      firstName: 'Imani',
      lastName: 'Crumble',
      email: 'client@example.com',
      eventName: 'House Music Brunch',
      eventDate,
      eventTimeZone,
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
    })
  })

  it('refuses confirmation payloads when email, event name, or timezone are missing', () => {
    const booking: BookingConfirmationSource = {
      id: 'booking-2',
      status: 'confirmed',
      event_name: null,
      event_date: eventDate,
      event_timezone: eventTimeZone,
      venue: null,
      city: null,
      clients: [{ first_name: 'Imani', last_name: 'Crumble', email: null }],
    }

    expect(getConfirmationPayloadFromBooking(booking)).toBeNull()
  })

  it('builds the inquiry receipt payload with a fallback first name', () => {
    const booking: BookingInquiryReceiptSource = {
      id: 'booking-3',
      event_name: 'Summer Kickoff',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      clients: [{ first_name: null, last_name: null, email: 'client@example.com' }],
    }

    expect(getInquiryReceiptPayloadFromBooking(booking)).toEqual({
      firstName: 'there',
      lastName: null,
      email: 'client@example.com',
      eventName: 'Summer Kickoff',
      eventDate,
      eventTimeZone,
    })
  })

  it('builds a deposit reminder only when some deposit is still unpaid', () => {
    const booking: BookingDepositReminderSource = {
      id: 'booking-4',
      event_name: 'Corporate After-Party',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      deposit_amount: 500,
      clients: baseClient,
      payments: [{ amount: 200, status: 'received' }],
    }

    expect(getDepositReminderPayloadFromBooking(booking)?.depositDue).toBe('$300.00')
  })

  it('suppresses deposit reminders when the deposit is already covered', () => {
    const booking: BookingDepositReminderSource = {
      id: 'booking-5',
      event_name: 'Corporate After-Party',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      deposit_amount: 500,
      clients: baseClient,
      payments: [{ amount: 500, status: 'received' }],
    }

    expect(getDepositReminderPayloadFromBooking(booking)).toBeNull()
  })

  it('builds a balance reminder only when the quote still has an unpaid balance', () => {
    const booking: BookingBalanceReminderSource = {
      id: 'booking-6',
      event_name: 'Wedding Reception',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      quote: 1200,
      clients: baseClient,
      payments: [{ amount: 300, status: 'received' }],
    }

    expect(getBalanceReminderPayloadFromBooking(booking)?.balanceDue).toBe('$900.00')
  })

  it('suppresses balance reminders when the quote is fully paid', () => {
    const booking: BookingBalanceReminderSource = {
      id: 'booking-7',
      event_name: 'Wedding Reception',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      quote: 1200,
      clients: baseClient,
      payments: [{ amount: 1200, status: 'received' }],
    }

    expect(getBalanceReminderPayloadFromBooking(booking)).toBeNull()
  })

  it('builds the event reminder payload when email, event name, and timezone are present', () => {
    const booking: BookingEventReminderSource = {
      id: 'booking-8',
      status: 'confirmed',
      event_name: 'Club Night',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      venue: 'Spybar',
      city: 'Chicago, IL',
      clients: baseClient,
    }

    expect(getEventReminderPayloadFromBooking(booking)).toEqual({
      firstName: 'Imani',
      lastName: 'Crumble',
      email: 'client@example.com',
      eventName: 'Club Night',
      eventDate,
      eventTimeZone,
      venue: 'Spybar',
      city: 'Chicago, IL',
    })
  })

  it('refuses event reminders when the core email fields are incomplete', () => {
    const booking: BookingEventReminderSource = {
      id: 'booking-9',
      status: 'confirmed',
      event_name: 'Club Night',
      event_date: eventDate,
      event_timezone: null,
      venue: 'Spybar',
      city: 'Chicago, IL',
      clients: baseClient,
    }

    expect(getEventReminderPayloadFromBooking(booking)).toBeNull()
  })
})
