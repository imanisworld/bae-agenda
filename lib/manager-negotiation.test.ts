import { describe, expect, it } from 'vitest'
import { buildManagerNegotiation } from './manager-negotiation'

const profile = {
  minimum_fee: 150,
  target_hourly_rate: 300,
  max_drive_minutes: 90,
}

describe('buildManagerNegotiation', () => {
  it('accepts when fee and effective rate meet targets', () => {
    const result = buildManagerNegotiation(profile, {
      compensation_min: 900,
      expected_work_hours: 3,
      travel_minutes: 0,
      effective_hourly_rate: 300,
      economics_basis: 'all_in_net',
    })

    expect(result.decision).toBe('accept')
    expect(result.suggested_counter_fee).toBeNull()
  })

  it('counters when minimum is met but hourly target is missed', () => {
    const result = buildManagerNegotiation(profile, {
      title: 'Brand event',
      organization: 'Example Brand',
      compensation_min: 600,
      expected_work_hours: 4,
      travel_minutes: 30,
      travel_cost_estimate: 25,
      travel_covered: false,
      effective_hourly_rate: 115,
      economics_basis: 'all_in_net',
    })

    expect(result.decision).toBe('counter')
    expect(result.suggested_counter_fee).toBe(1525)
    expect(result.counter_draft).toMatch(/\$1,525/)
  })

  it('passes when known maximum cannot meet the minimum', () => {
    const result = buildManagerNegotiation(profile, {
      compensation_min: 75,
      compensation_max: 100,
      expected_work_hours: 1,
      travel_minutes: 10,
    })

    expect(result.decision).toBe('pass')
  })

  it('passes when travel exceeds the saved limit without coverage', () => {
    const result = buildManagerNegotiation(profile, {
      compensation_min: 1000,
      expected_work_hours: 2,
      travel_minutes: 120,
      travel_covered: false,
    })

    expect(result.decision).toBe('pass')
    expect(result.reasons.join(' ')).toMatch(/above the 90-minute limit/)
  })

  it('asks for information when pay/hours are incomplete', () => {
    const result = buildManagerNegotiation(profile, {
      compensation_min: 300,
      travel_minutes: 20,
    })

    expect(result.decision).toBe('needs_info')
    expect(result.missing).toContain('expected work hours')
  })
})
