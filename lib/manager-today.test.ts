import { describe, expect, it } from 'vitest'
import { buildManagerTodayQueue, type ManagerTodayItem } from './manager-today'

// Noon UTC on 2026-10-05 is 08:00 in Indianapolis, so "today" is 2026-10-05.
const now = new Date('2026-10-05T12:00:00Z')

function lead(overrides: Partial<ManagerTodayItem> & { id: string }): ManagerTodayItem {
  return {
    title: overrides.id,
    organization: null,
    status: 'review',
    fit_score: 50,
    next_action: null,
    next_action_at: null,
    outreach_missing_items: [],
    event_date: null,
    application_deadline: null,
    ...overrides,
  }
}

function queue(items: ManagerTodayItem[], limit?: number) {
  return buildManagerTodayQueue(items, { now, limit })
}

describe('buildManagerTodayQueue', () => {
  it('follows the agenda order', () => {
    const { entries } = queue([
      lead({ id: 'review', status: 'review' }),
      lead({ id: 'blocked', status: 'review', outreach_missing_items: ['contact route'] }),
      lead({ id: 'ready', status: 'outreach_ready' }),
      lead({ id: 'negotiating', status: 'negotiating', next_action: 'Continue negotiation.' }),
      lead({ id: 'due', status: 'contacted', next_action_at: '2026-10-05' }),
      lead({ id: 'overdue', status: 'contacted', next_action_at: '2026-10-01' }),
    ])

    expect(entries.map((entry) => [entry.item.id, entry.priority])).toEqual([
      ['overdue', 1],
      ['due', 2],
      ['negotiating', 3],
      ['ready', 4],
      ['blocked', 5],
      ['review', 6],
    ])
  })

  it('does not call a dated review action a follow-up', () => {
    const { entries } = queue([
      lead({ id: 'review', status: 'review', next_action: 'Confirm organizer', next_action_at: '2026-10-01' }),
    ])

    expect(entries[0].priority).toBe(1)
    expect(entries[0].label).toBe('Overdue: Confirm organizer')
  })

  it('keeps contacted leads with no follow-up date in the queue', () => {
    const { entries } = queue([lead({ id: 'replied', status: 'contacted' })])

    expect(entries[0].priority).toBe(3)
    expect(entries[0].label).toMatch(/set next step/)
  })

  it('treats outreach_ready leads with missing items as blocked', () => {
    const { entries } = queue([
      lead({ id: 'ready-but-missing', status: 'outreach_ready', outreach_missing_items: ['mix', 'contact'] }),
    ])

    expect(entries[0].priority).toBe(5)
    expect(entries[0].label).toBe('Resolve 2 blockers')
  })

  it('ignores stale outreach blockers once a lead is contacted', () => {
    const { entries } = queue([
      lead({ id: 'sent', status: 'applied', next_action_at: '2026-10-12', outreach_missing_items: ['mix'] }),
    ])

    expect(entries).toEqual([])
  })

  it('flags pre-outreach leads whose deadline or event date passed', () => {
    const { entries } = queue([
      lead({ id: 'late', status: 'outreach_ready', event_date: '2026-10-01' }),
    ])

    expect(entries[0].priority).toBe(5)
    expect(entries[0].label).toBe('Event date passed — pass or update')
  })

  it('orders ties by soonest date, then fit', () => {
    const { entries } = queue([
      lead({ id: 'high-fit-undated', status: 'outreach_ready', fit_score: 90 }),
      lead({ id: 'later', status: 'outreach_ready', fit_score: 60, event_date: '2026-11-01' }),
      lead({ id: 'sooner', status: 'outreach_ready', fit_score: 40, application_deadline: '2026-10-10' }),
    ])

    expect(entries.map((entry) => entry.item.id)).toEqual(['sooner', 'later', 'high-fit-undated'])
  })

  it('excludes closed leads and reports the total beyond the limit', () => {
    const items = [
      lead({ id: 'booked', status: 'booked', next_action_at: '2026-10-01' }),
      lead({ id: 'passed', status: 'passed' }),
      ...Array.from({ length: 4 }, (_, index) => lead({ id: `r${index}` })),
    ]
    const result = queue(items, 3)

    expect(result.entries).toHaveLength(3)
    expect(result.total).toBe(4)
  })
})
