import { describe, expect, it } from 'vitest'
import {
  getBalanceReminderPayloadFromBooking,
  getConfirmationPayloadFromBooking,
  getInquiryReceiptPayloadFromBooking,
  getPostEventFollowUpPayloadFromBooking,
  getReviewRequestPayloadFromBooking,
  type BookingBalanceReminderSource,
  type BookingConfirmationSource,
  type BookingInquiryReceiptSource,
  type BookingPostEventFollowUpSource,
  type BookingReviewRequestSource,
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

  it('builds the post-event follow-up payload for completed bookings', () => {
    const booking: BookingPostEventFollowUpSource = {
      id: 'booking-8',
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
      id: 'booking-9',
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

  it('builds the review request payload for completed bookings', () => {
    const booking: BookingReviewRequestSource = {
      id: 'booking-10',
      status: 'completed',
      event_name: 'After Hours Set',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      clients: baseClient,
    }

    expect(getReviewRequestPayloadFromBooking(booking)).toEqual({
      firstName: 'Imani',
      lastName: 'Crumble',
      email: 'client@example.com',
      eventName: 'After Hours Set',
      eventDate,
      eventTimeZone,
      reviewUrl: 'http://localhost:3000/#leave-review',
    })
  })

  it('suppresses the review request payload until the booking is completed', () => {
    const booking: BookingReviewRequestSource = {
      id: 'booking-11',
      status: 'confirmed',
      event_name: 'After Hours Set',
      event_date: eventDate,
      event_timezone: eventTimeZone,
      clients: baseClient,
    }

    expect(getReviewRequestPayloadFromBooking(booking)).toBeNull()
  })
})
