/**
 * APP-LEVEL TYPES
 * Composed types that join multiple DB tables or add UI-layer shape.
 */
import type { Database } from './database'

export type Tables = Database['public']['Tables']

// Raw row types
export type Event    = Tables['events']['Row']
export type Client   = Tables['clients']['Row']
export type Booking  = Tables['bookings']['Row']
export type Payment  = Tables['payments']['Row']
export type Invoice  = Tables['invoices']['Row']
export type Mix      = Tables['mixes']['Row']
export type Content  = Tables['site_content']['Row']
export type Note     = Tables['notes']['Row']

// Composed types
export type BookingWithClient = Booking & {
  clients: Pick<Client, 'id' | 'first_name' | 'last_name' | 'email' | 'phone'> | null
}

export type BookingWithPayments = Booking & {
  payments: Payment[]
  clients: Client | null
}

export type ClientWithBookings = Client & {
  bookings: Booking[]
}

// Status types (pulled from DB constraints)
// Note: events have no status column — upcoming vs past is determined by event_date
export type BookingStatus = Booking['status']
export type PaymentStatus = Payment['status']
export type PaymentType   = Payment['type']
export type PaymentMethod = NonNullable<Payment['method']>
