import { describe, expect, it } from 'vitest'
import { formatEventTimeRange, isValidTimeZone, toEventISO } from './date-time'

describe('date-time helpers', () => {
  it('accepts valid time zones and rejects invalid ones', () => {
    expect(isValidTimeZone('America/Indiana/Indianapolis')).toBe(true)
    expect(isValidTimeZone('Not/A_Timezone')).toBe(false)
  })

  it('converts local event date and time into a stable ISO string', () => {
    expect(
      toEventISO('2026-07-04', 'America/Indiana/Indianapolis', '18:30')
    ).toBe('2026-07-04T22:30:00.000Z')
  })

  it('returns null for invalid local times that do not exist in the zone', () => {
    expect(
      toEventISO('2026-03-08', 'America/Indiana/Indianapolis', '02:30')
    ).toBeNull()
  })

  it('formats event time ranges when both endpoints are available', () => {
    expect(
      formatEventTimeRange(
        '2026-07-04T22:30:00.000Z',
        '2026-07-05T00:00:00.000Z',
        'America/Indiana/Indianapolis'
      )
    ).toBe('6:30 PM - 8:00 PM')
  })
})
