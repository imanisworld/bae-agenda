import { describe, expect, it } from 'vitest'
import {
  getBalanceReminderPayloadFromBooking,
  getConfirmationPayloadFromBooking,
  getDepositReceivedPayloadFromBooking,
  getDepositReminderPayloadFromBooking,
  getEventReminderPayloadFromBooking,
  getFullyPaidPayloadFromBooking,
  getInquiryReceiptPayloadFromBooking,
  getPostEventFollowUpPayloadFromBooking,
  type BookingBalanceReminderSource,
  type BookingConfirmationSource,
  type BookingDepositReceivedSource,
  type BookingDepositReminderSource,
  type BookingEventReminderSource,
  type BookingFullyPaidSource,
  type BookingInquiryReceiptSource,
  type BookingPostEventFollowUpSource,
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
      quote: 1200,
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
      deposit_amount: 300,
      clients: baseClient,
      payments: [{ amount: 100, status: 'received' }],
    }

    expect(getConfirmationPayloadFromBooking(booking)).toEqual({
      firstName: 'Imani',
      lastName: 'Crumble',
      email: 'client@example.com',
      eventName: 'House Music Brunch',
      eventDate,
      eventTimeZone,
      totalAmount: '$1,200.00',
      depositAmount: '$300.00',
      remainingAmount: '$900.00',
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
      depositDue: '$200.00',
      payUrl: 'http://localhost:3000/pay/booking-1',
    })
  })

  it('refuses confirmation payloads when email, event name, or timezone are missing', () => {
    const booking: BookingConfirmationSource = {
      id: 'booking-2',
      status: 'confirmed',
      event_name: null,
      event_date: eventDate,
      event_timezone: eventTimeZone,
      quote: null,
      venue: null,
      city: null,
      deposit_amount: null,
      clients: [{ first_name: 'Imani', last_name: 'Crumble', email: null }],
      payments: null,
    }

    expect(getConfirmationPayloadFromBooking(booking)).toBeNull()
  })

  it('omits the payment link when no deposit is currently due', () => {
    const booking: BookingConfirmationSource = {
      id: 'booking-2b',
      status: 'confirmed',
      event_name: 'Sunset Set',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      quote: 900,
      venue: 'White River',
      city: 'Indianapolis, IN',
      deposit_amount: 300,
      clients: baseClient,
      payments: [{ amount: 300, status: 'received' }],
    }

    expect(getConfirmationPayloadFromBooking(booking)).toMatchObject({
      depositDue: null,
      payUrl: null,
    })
  })

  it('builds the inquiry receipt payload with a fallback first name', () => {
    const booking: BookingInquiryReceiptSource = {
      id: 'booking-3',
      event_name: 'Summer Kickoff',
      event_type: 'Private Party',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
      clients: [{ first_name: null, last_name: null, email: 'client@example.com' }],
    }

    expect(getInquiryReceiptPayloadFromBooking(booking)).toEqual({
      firstName: 'there',
      lastName: null,
      email: 'client@example.com',
      eventName: 'Summer Kickoff',
      eventType: 'Private Party',
      eventDate,
      eventTimeZone,
      location: 'Canal Bistro, Indianapolis, IN',
    })
  })

  it('accepts a one-to-one joined client object from Supabase', () => {
    const booking: BookingInquiryReceiptSource = {
      id: 'booking-3b',
      event_name: 'Summer Kickoff',
      event_type: 'Private Party',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
      clients: { first_name: 'Imani', last_name: 'Crumble', email: 'client@example.com' },
    }

    expect(getInquiryReceiptPayloadFromBooking(booking)).toMatchObject({
      firstName: 'Imani',
      email: 'client@example.com',
      eventName: 'Summer Kickoff',
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

    expect(getBalanceReminderPayloadFromBooking(booking)).toMatchObject({
      balanceDue: '$900.00',
      payUrl: null,
    })
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

  it('builds the deposit received payload once the deposit is covered', () => {
    const booking: BookingDepositReceivedSource = {
      id: 'booking-10',
      status: 'confirmed',
      event_name: 'Rooftop Day Party',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      quote: 1500,
      deposit_amount: 500,
      venue: 'Skyline Loft',
      city: 'Chicago, IL',
      clients: baseClient,
      payments: [{ amount: 500, status: 'received' }],
    }

    expect(getDepositReceivedPayloadFromBooking(booking)).toEqual({
      firstName: 'Imani',
      lastName: 'Crumble',
      email: 'client@example.com',
      eventName: 'Rooftop Day Party',
      eventDate,
      eventTimeZone,
      totalAmount: '$1,500.00',
      depositAmount: '$500.00',
      remainingAmount: '$1,000.00',
      venue: 'Skyline Loft',
      city: 'Chicago, IL',
    })
  })

  it('suppresses the deposit received payload until the deposit is actually paid', () => {
    const booking: BookingDepositReceivedSource = {
      id: 'booking-11',
      status: 'confirmed',
      event_name: 'Rooftop Day Party',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      quote: 1500,
      deposit_amount: 500,
      venue: 'Skyline Loft',
      city: 'Chicago, IL',
      clients: baseClient,
      payments: [{ amount: 200, status: 'received' }],
    }

    expect(getDepositReceivedPayloadFromBooking(booking)).toBeNull()
  })

  it('builds the fully paid payload once the quote is covered', () => {
    const booking: BookingFullyPaidSource = {
      id: 'booking-12',
      status: 'confirmed',
      event_name: 'Wedding Reception',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      quote: 1200,
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
      clients: baseClient,
      payments: [{ amount: 1200, status: 'received' }],
    }

    expect(getFullyPaidPayloadFromBooking(booking)).toEqual({
      firstName: 'Imani',
      lastName: 'Crumble',
      email: 'client@example.com',
      eventName: 'Wedding Reception',
      eventDate,
      eventTimeZone,
      totalPaid: '$1,200.00',
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
    })
  })

  it('suppresses the fully paid payload when a balance is still due', () => {
    const booking: BookingFullyPaidSource = {
      id: 'booking-13',
      status: 'confirmed',
      event_name: 'Wedding Reception',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      quote: 1200,
      venue: 'Canal Bistro',
      city: 'Indianapolis, IN',
      clients: baseClient,
      payments: [{ amount: 900, status: 'received' }],
    }

    expect(getFullyPaidPayloadFromBooking(booking)).toBeNull()
  })

  it('builds the post-event follow-up payload for completed bookings', () => {
    const booking: BookingPostEventFollowUpSource = {
      id: 'booking-14',
      status: 'completed',
      event_name: 'Brunch Set',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      venue: 'Gallery Cafe',
      city: 'Indianapolis, IN',
      clients: baseClient,
    }

    expect(getPostEventFollowUpPayloadFromBooking(booking)).toEqual({
      firstName: 'Imani',
      lastName: 'Crumble',
      email: 'client@example.com',
      eventName: 'Brunch Set',
      eventDate,
      eventTimeZone,
      location: 'Gallery Cafe, Indianapolis, IN',
    })
  })

  it('suppresses the post-event follow-up payload until the booking is completed', () => {
    const booking: BookingPostEventFollowUpSource = {
      id: 'booking-15',
      status: 'confirmed',
      event_name: 'Brunch Set',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      venue: 'Gallery Cafe',
      city: 'Indianapolis, IN',
      clients: baseClient,
    }

    expect(getPostEventFollowUpPayloadFromBooking(booking)).toBeNull()
  })
})
