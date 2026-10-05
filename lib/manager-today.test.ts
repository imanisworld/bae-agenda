import { describe, expect, it } from 'vitest'
import { buildManagerTodayQueue } from './manager-today'

describe('buildManagerTodayQueue', () => {
  it('prioritizes overdue follow-up before outreach-ready work', () => {
    const queue = buildManagerTodayQueue([
      {
        id: '1',
        title: 'Ready lead',
        organization: null,
        status: 'outreach_ready',
        fit_score: 90,
        next_action: null,
        next_action_at: null,
        outreach_missing_items: [],
      },
      {
        id: '2',
        title: 'Late follow-up',
        organization: null,
        status: 'contacted',
        fit_score: 60,
        next_action: 'Follow up',
        next_action_at: '2020-01-01',
        outreach_missing_items: [],
      },
    ])

    expect(queue[0].item.id).toBe('2')
    expect(queue[0].priority).toBe(1)
  })

  it('surfaces outreach blockers before ordinary review leads', () => {
    const queue = buildManagerTodayQueue([
      {
        id: '1',
        title: 'Review',
        organization: null,
        status: 'review',
        fit_score: 80,
        next_action: null,
        next_action_at: null,
        outreach_missing_items: [],
      },
      {
        id: '2',
        title: 'Blocked',
        organization: null,
        status: 'review',
        fit_score: 70,
        next_action: null,
        next_action_at: null,
        outreach_missing_items: ['contact route'],
      },
    ])

    expect(queue[0].item.id).toBe('2')
    expect(queue[0].priority).toBe(5)
  })
})
