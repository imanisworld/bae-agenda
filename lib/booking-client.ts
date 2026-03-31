export type BookingClientRecord = {
  id?: string | null
  first_name: string | null
  last_name?: string | null
  email: string | null
  phone?: string | null
}

export type BookingClientRelation<T extends BookingClientRecord = BookingClientRecord> =
  | T
  | T[]
  | null
  | undefined

export function getPrimaryBookingClient<T extends BookingClientRecord>(
  clientRelation: BookingClientRelation<T>
): T | null {
  if (!clientRelation) return null
  return Array.isArray(clientRelation) ? clientRelation[0] ?? null : clientRelation
}
