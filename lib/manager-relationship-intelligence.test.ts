import { describe, expect, it } from 'vitest'
import {
  buildManagerRelationshipRows,
  hasRecurringRelationshipEvidence,
  type ManagerRelationshipSignal,
  type ManagerRelationshipSource,
} from './manager-relationship-intelligence'

const source: ManagerRelationshipSource = {
  id: 'source-1',
  name: 'Example Promoter',
  source_kind: 'promoter',
  url: 'https://example.com',
  location_city: 'Indianapolis',
  location_state: 'IN',
  notes: null,
}

function signal(
  overrides: Partial<ManagerRelationshipSignal> = {}
): ManagerRelationshipSignal {
  return {
    id: 'signal-1',
    source_id: source.id,
    signal_type: 'venue_programming',
    status: 'relevant',
    title: 'Monthly guest-DJ rotation',
    url: 'https://example.com/event',
    published_at: '2026-10-01T12:00:00Z',
    discovered_at: '2026-10-01T13:00:00Z',
    summary: null,
    linked_opportunity_id: null,
    source_payload: {},
    ...overrides,
  }
}

describe('manager relationship intelligence', () => {
  it('recognizes explicit recurring-program evidence without inventing an opportunity', () => {
    expect(hasRecurringRelationshipEvidence(signal(), source)).toBe(true)

    const [row] = buildManagerRelationshipRows([source], [signal()])
    expect(row.strength).toBe('recurring_program')
    expect(row.linkedOpportunityCount).toBe(0)
  })

  it('promotes multiple verified signals to repeated observation', () => {
    const rows = buildManagerRelationshipRows(
      [source],
      [
        signal(),
        signal({
          id: 'signal-2',
          title: 'Second verified event',
          published_at: '2026-10-02T12:00:00Z',
        }),
      ]
    )

    expect(rows[0].strength).toBe('repeat_observed')
    expect(rows[0].relevantCount).toBe(2)
    expect(rows[0].latestSignal?.id).toBe('signal-2')
  })

  it('does not treat ignored noise as relationship evidence', () => {
    const [row] = buildManagerRelationshipRows(
      [source],
      [signal({ status: 'ignored', title: 'Monthly unrelated listing' })]
    )

    expect(row.strength).toBe('watch_only')
    expect(row.relevantCount).toBe(0)
    expect(row.ignoredCount).toBe(1)
  })
})
