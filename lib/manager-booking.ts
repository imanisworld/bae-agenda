import { suggestEventTimeZone } from '@/lib/event-form-options'

export type ManagerBookingSource = {
  id: string
  title: string
  organization?: string | null
  venue_name?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  location_city?: string | null
  location_state?: string | null
  event_date?: string | null
  expected_work_hours?: number | null
  compensation_min?: number | null
  source_url?: string | null
  linked_booking_id?: string | null
}

export type ManagerBookingPrefill = {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventName: string
  eventDate: string
  city: string
  venue: string
  timeZone: string
  hours: number | null
  quote: number | null
  notes: string
}

function splitContactName(value: string | null | undefined) {
  const parts = (value ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

export function buildManagerBookingPrefill(
  opportunity: ManagerBookingSource
): ManagerBookingPrefill {
  const contact = splitContactName(opportunity.contact_name)
  const city = [opportunity.location_city, opportunity.location_state]
    .filter(Boolean)
    .join(', ')

  const noteParts = [
    `Converted from Manager opportunity: ${opportunity.title}`,
    opportunity.organization ? `Organization: ${opportunity.organization}` : null,
    opportunity.source_url ? `Source: ${opportunity.source_url}` : null,
  ].filter(Boolean)

  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: opportunity.contact_email ?? '',
    phone: opportunity.contact_phone ?? '',
    eventName: opportunity.title,
    eventDate: opportunity.event_date ?? '',
    city,
    venue: opportunity.venue_name ?? '',
    timeZone: suggestEventTimeZone(city) ?? '',
    hours: opportunity.expected_work_hours ?? null,
    quote: opportunity.compensation_min ?? null,
    notes: noteParts.join('\n'),
  }
}
