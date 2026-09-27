import { describe, expect, it } from 'vitest'
import {
  getEventCandidateFloorIso,
  isUpcomingEventRecord,
} from './event-schedule'

describe('event schedule rules', () => {
  it('keeps a legacy date-only event visible for its whole Indianapolis calendar day', () => {
    const now = new Date('2026-10-03T20:00:00.000Z')

    expect(
      isUpcomingEventRecord(
        {
          event_date: '2026-10-03T00:00:00.000Z',
          event_timezone: null,
        },
        now
      )
    ).toBe(true)
  })

  it('uses the actual instant once an event timezone has been reviewed', () => {
    const now = new Date('2026-10-04T02:30:00.000Z')

    expect(
      isUpcomingEventRecord(
        {
          event_date: '2026-10-04T02:00:00.000Z',
          event_timezone: 'America/Indiana/Indianapolis',
        },
        now
      )
    ).toBe(false)
  })

  it('keeps a future reviewed event upcoming', () => {
    const now = new Date('2026-10-03T20:00:00.000Z')

    expect(
      isUpcomingEventRecord(
        {
          event_date: '2026-10-04T02:00:00.000Z',
          event_timezone: 'America/Indiana/Indianapolis',
        },
        now
      )
    ).toBe(true)
  })

  it('queries far enough back to include same-day events in eastern time zones', () => {
    expect(
      getEventCandidateFloorIso(new Date('2026-10-03T16:00:00.000Z'))
    ).toBe('2026-10-02T00:00:00.000Z')
  })
})
