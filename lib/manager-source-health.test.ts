import { describe, expect, it } from 'vitest'
import {
  managerSignalCanBecomeOpportunity,
  managerSourceCheckState,
  managerSourceNextCheckAt,
} from './manager-source-health'

describe('Manager source health', () => {
  it('marks active sources due when their cadence has elapsed', () => {
    expect(managerSourceCheckState({
      active: true,
      last_checked_at: '2026-10-07T12:00:00Z',
      check_frequency_hours: 4,
    }, new Date('2026-10-07T16:00:00Z'))).toBe('due')
  })

  it('keeps a source current before its cadence elapses', () => {
    expect(managerSourceCheckState({
      active: true,
      last_checked_at: '2026-10-07T12:00:00Z',
      check_frequency_hours: 6,
    }, new Date('2026-10-07T16:00:00Z'))).toBe('current')
  })

  it('calculates the next due time from the actual last check', () => {
    expect(managerSourceNextCheckAt({
      last_checked_at: '2026-10-07T12:00:00Z',
      check_frequency_hours: 6,
    })?.toISOString()).toBe('2026-10-07T18:00:00.000Z')
  })
})

describe('Manager signal opportunity guardrail', () => {
  it('blocks relationship-only and venue-programming signals', () => {
    expect(managerSignalCanBecomeOpportunity({
      signal_type: 'venue_programming',
      source_payload: { lead_strength: 'relationship_signal' },
      source_kind: 'venue',
    })).toBe(false)
  })

  it('blocks explicitly non-actionable and agency signals', () => {
    expect(managerSignalCanBecomeOpportunity({
      signal_type: 'event',
      source_payload: { actionable: false },
      source_kind: 'event_brand',
    })).toBe(false)
    expect(managerSignalCanBecomeOpportunity({
      signal_type: 'job',
      source_kind: 'agency',
    })).toBe(false)
  })

  it('allows an eligible direct booking call', () => {
    expect(managerSignalCanBecomeOpportunity({
      signal_type: 'booking_call',
      source_payload: { actionable: true },
      source_kind: 'promoter',
    })).toBe(true)
  })
})
