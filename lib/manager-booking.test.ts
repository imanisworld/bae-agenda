import { describe, expect, it } from 'vitest'
import { buildManagerBookingPrefill } from './manager-booking'

describe('buildManagerBookingPrefill', () => {
  it('prefills known Manager opportunity fields without inventing missing data', () => {
    const result = buildManagerBookingPrefill({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Silent Disco Party DJ',
      organization: 'Silent Disco Company',
      venue_name: 'Example Venue',
      contact_name: 'Avery Smith',
      contact_email: 'avery@example.com',
      contact_phone: '3175550100',
      location_city: 'Indianapolis',
      location_state: 'IN',
      event_date: '2026-10-23',
      expected_work_hours: 5,
      compensation_min: 825,
      source_url: 'https://example.com/gig',
    })

    expect(result.firstName).toBe('Avery')
    expect(result.lastName).toBe('Smith')
    expect(result.eventName).toBe('Silent Disco Party DJ')
    expect(result.eventDate).toBe('2026-10-23')
    expect(result.city).toBe('Indianapolis, IN')
    expect(result.timeZone).toBe('America/Indiana/Indianapolis')
    expect(result.hours).toBe(5)
    expect(result.quote).toBe(825)
    expect(result.notes).toContain('Converted from Manager opportunity')
  })

  it('keeps client and time-zone fields blank when the source does not establish them', () => {
    const result = buildManagerBookingPrefill({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Potential DJ Booking',
      location_city: 'Unknown City',
      location_state: 'IN',
    })

    expect(result.firstName).toBe('')
    expect(result.email).toBe('')
    expect(result.timeZone).toBe('')
    expect(result.hours).toBeNull()
    expect(result.quote).toBeNull()
  })
})
