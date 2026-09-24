import { describe, expect, it } from 'vitest'
import {
  formatEventTimeRange,
  getLocalDateString,
  getScheduledReminderQueryWindow,
  isCalendarDaysOut,
  isHoursAwayWithinRange,
  isValidTimeZone,
  toEventISO,
} from './date-time'

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

  it('formats a local calendar date string in a target time zone', () => {
    expect(
      getLocalDateString(
        new Date('2026-07-04T22:30:00.000Z'),
        'America/Indiana/Indianapolis'
      )
    ).toBe('2026-07-04')
  })

  it('matches a booking that is exactly seven local calendar days away', () => {
    expect(
      isCalendarDaysOut(
        '2026-07-11T22:30:00.000Z',
        'America/Indiana/Indianapolis',
        7,
        new Date('2026-07-04T13:00:00.000Z')
      )
    ).toBe(true)
  })

  it('matches bookings inside a 48-hour reminder window', () => {
    expect(
      isHoursAwayWithinRange(
        '2026-07-04T22:30:00.000Z',
        47,
        49,
        new Date('2026-07-02T23:00:00.000Z')
      )
    ).toBe(true)
  })

  it('rejects bookings outside the 48-hour reminder window', () => {
    expect(
      isHoursAwayWithinRange(
        '2026-07-04T22:30:00.000Z',
        47,
        49,
        new Date('2026-07-03T23:00:00.000Z')
      )
    ).toBe(false)
  })

  it('keeps review-request bookings inside the daily cron query window', () => {
    const now = new Date('2026-07-15T15:00:00.000Z')
    const { windowStart, windowEnd } = getScheduledReminderQueryWindow(now)
    // Four days after a 18:30 event: inside the 72–240h review window, and
    // after the old 3-day lookback that the next daily run would have missed.
    const event = new Date('2026-07-11T18:30:00.000Z')
    const hoursSince = (now.getTime() - event.getTime()) / (1000 * 60 * 60)
    const previousLookback = new Date(now)
    previousLookback.setUTCDate(previousLookback.getUTCDate() - 3)

    expect(hoursSince).toBeGreaterThanOrEqual(72)
    expect(hoursSince).toBeLessThan(240)
    expect(event.getTime()).toBeLessThan(previousLookback.getTime())
    expect(event.getTime()).toBeGreaterThanOrEqual(windowStart.getTime())
    expect(event.getTime()).toBeLessThanOrEqual(windowEnd.getTime())
  })

  it('still includes a balance reminder seven days ahead', () => {
    const now = new Date('2026-07-04T15:00:00.000Z')
    const { windowEnd } = getScheduledReminderQueryWindow(now)
    const event = new Date('2026-07-11T22:30:00.000Z')

    expect(event.getTime()).toBeLessThanOrEqual(windowEnd.getTime())
  })
})
