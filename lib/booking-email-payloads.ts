import { getOutstandingBalance, getOutstandingDeposit } from '@/lib/booking-finance'
import { getPrimaryBookingClient, type BookingClientRelation } from '@/lib/booking-client'
import { getAppBaseUrl } from '@/lib/stripe'
import type { BookingStatus, PaymentStatus } from '@/types/index'

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

type BookingClient = {
  first_name: string | null
  last_name: string | null
  email: string | null
}

export interface BookingConfirmationSource {
  id: string
  status: BookingStatus
  event_name: string | null
  event_date: string
  event_timezone: string | null
  quote: number | null
  venue: string | null
  city: string | null
  deposit_amount: number | null
  clients: BookingClientRelation<BookingClient>
  payments: Array<{
    amount: number
    status: PaymentStatus
  }> | null
}

export interface BookingInquiryReceiptSource {
  id: string
  event_name: string | null
  event_type: string | null
  event_date: string
  event_timezone: string | null
  venue: string | null
  city: string | null
  clients: BookingClientRelation<BookingClient>
}

export interface BookingBalanceReminderSource {
  id: string
  event_name: string | null
  event_date: string
  event_timezone: string | null
  quote: number | null
  clients: BookingClientRelation<BookingClient>
  payments: Array<{
    amount: number
    status: PaymentStatus
  }> | null
}

export interface BookingPostEventFollowUpSource {
  id: string
  status: BookingStatus
  event_name: string | null
  event_date: string
  event_timezone: string | null
  venue: string | null
  city: string | null
  clients: BookingClientRelation<BookingClient>
}

export function getConfirmationPayloadFromBooking(booking: BookingConfirmationSource | null) {
  if (!booking) return null

  const client = getPrimaryBookingClient(booking.clients)
  const clientEmail = client?.email?.trim()
  const eventTimeZone = booking.event_timezone?.trim()
  const depositRemaining = getOutstandingDeposit(booking.deposit_amount, booking.payments)

  if (!clientEmail || !booking.event_name || !eventTimeZone) {
    return null
  }

  return {
    firstName: client?.first_name?.trim() || 'there',
    lastName: client?.last_name?.trim() || null,
    email: clientEmail,
    eventName: booking.event_name,
    eventDate: booking.event_date,
    eventTimeZone,
    totalAmount: formatCurrency(booking.quote ?? 0),
    depositAmount: formatCurrency(booking.deposit_amount ?? 0),
    remainingAmount: formatCurrency(Math.max((booking.quote ?? 0) - (booking.deposit_amount ?? 0), 0)),
    venue: booking.venue,
    city: booking.city,
    depositDue: depositRemaining > 0 ? formatCurrency(depositRemaining) : null,
    payUrl: depositRemaining > 0 ? `${getAppBaseUrl()}/pay/${booking.id}` : null,
  }
}

export function getInquiryReceiptPayloadFromBooking(booking: BookingInquiryReceiptSource | null) {
  if (!booking) return null

  const client = getPrimaryBookingClient(booking.clients)
  const clientEmail = client?.email?.trim()
  const eventTimeZone = booking.event_timezone?.trim()

  if (!clientEmail || !booking.event_name || !eventTimeZone) {
    return null
  }

  return {
    firstName: client?.first_name?.trim() || 'there',
    lastName: client?.last_name?.trim() || null,
    email: clientEmail,
    eventName: booking.event_name,
    eventType: booking.event_type,
    eventDate: booking.event_date,
    eventTimeZone,
    location: [booking.venue, booking.city].filter(Boolean).join(', ') || null,
  }
}

export function getBalanceReminderPayloadFromBooking(booking: BookingBalanceReminderSource | null) {
  if (!booking) return null

  const client = getPrimaryBookingClient(booking.clients)
  const clientEmail = client?.email?.trim()
  const eventTimeZone = booking.event_timezone?.trim()
  const balanceRemaining = getOutstandingBalance(booking.quote, booking.payments)

  if (!clientEmail || !booking.event_name || !eventTimeZone || balanceRemaining <= 0) {
    return null
  }

  return {
    firstName: client?.first_name?.trim() || 'there',
    lastName: client?.last_name?.trim() || null,
    email: clientEmail,
    eventName: booking.event_name,
    eventDate: booking.event_date,
    eventTimeZone,
    balanceDue: formatCurrency(balanceRemaining),
    payUrl: null,
  }
}

export function getPostEventFollowUpPayloadFromBooking(booking: BookingPostEventFollowUpSource | null) {
  if (!booking) return null

  const client = getPrimaryBookingClient(booking.clients)
  const clientEmail = client?.email?.trim()
  const eventTimeZone = booking.event_timezone?.trim()

  if (!clientEmail || !booking.event_name || !eventTimeZone || booking.status !== 'completed') {
    return null
  }

  return {
    firstName: client?.first_name?.trim() || 'there',
    lastName: client?.last_name?.trim() || null,
    email: clientEmail,
    eventName: booking.event_name,
    eventDate: booking.event_date,
    eventTimeZone,
    location: [booking.venue, booking.city].filter(Boolean).join(', ') || null,
  }
}
