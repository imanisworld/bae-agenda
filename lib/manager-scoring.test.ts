import { describe, expect, it } from 'vitest'
import { scoreManagerOpportunity } from './manager-scoring'

const profile = {
  home_market: 'Indianapolis, IN',
  minimum_fee: 150,
  max_drive_minutes: 90,
  preferred_event_types: ['wedding', 'lounge'],
  excluded_event_types: ['unpaid showcase'],
  genres: ['open format', 'hip hop', 'r&b'],
}

describe('scoreManagerOpportunity', () => {
  it('rewards a local paid preferred-format opportunity', () => {
    const result = scoreManagerOpportunity(profile, {
      title: 'Wedding DJ',
      location_city: 'Indianapolis',
      location_state: 'IN',
      compensation_min: 500,
      compensation_max: 500,
      requirements: 'Open format hip hop and R&B',
      source_url: 'https://example.com/gig',
      event_date: '2026-11-01',
    })

    expect(result.score).toBe(100)
    expect(result.breakdown.pay.score).toBe(30)
    expect(result.breakdown.travel.score).toBe(25)
    expect(result.breakdown.eventFit.score).toBe(20)
    expect(result.breakdown.musicFit.score).toBe(15)
    expect(result.breakdown.readiness.score).toBe(10)
  })

  it('does not fail unknown information by default', () => {
    const result = scoreManagerOpportunity(profile, {
      title: 'Potential DJ partnership',
      source_url: 'https://example.com/source',
    })

    expect(result.breakdown.pay.score).toBe(15)
    expect(result.breakdown.travel.score).toBe(12)
    expect(result.score).toBeGreaterThan(0)
  })

  it('flags known pay below the minimum fee', () => {
    const result = scoreManagerOpportunity(profile, {
      title: 'DJ set',
      compensation_max: 100,
      source_url: 'https://example.com/low-pay',
    })

    expect(result.breakdown.pay.score).toBe(0)
    expect(result.breakdown.flags).toContain('below_minimum_fee')
  })

  it('caps over-limit travel without coverage', () => {
    const result = scoreManagerOpportunity(profile, {
      title: 'Wedding DJ',
      compensation_min: 500,
      travel_minutes: 180,
      travel_covered: false,
      requirements: 'Open format',
      source_url: 'https://example.com/far-gig',
      event_date: '2026-12-01',
    })

    expect(result.breakdown.flags).toContain('travel_over_limit')
    expect(result.score).toBeLessThanOrEqual(50)
  })

  it('caps excluded event types', () => {
    const result = scoreManagerOpportunity(profile, {
      title: 'Unpaid Showcase DJ',
      compensation_min: 500,
      location_city: 'Indianapolis',
      location_state: 'IN',
      requirements: 'Open format',
      source_url: 'https://example.com/showcase',
      event_date: '2026-12-01',
    })

    expect(result.breakdown.flags).toContain('excluded_event_type')
    expect(result.score).toBeLessThanOrEqual(50)
  })
})
