import { describe, expect, it } from 'vitest'
import { calculateManagerEconomics } from './manager-economics'

describe('calculateManagerEconomics', () => {
  it('calculates all-in net economics when time and costs are known', () => {
    const result = calculateManagerEconomics({
      compensation_min: 600,
      expected_work_hours: 3,
      travel_minutes: 30,
      travel_cost_estimate: 40,
      travel_covered: false,
    })

    expect(result.expected_total_hours).toBe(4)
    expect(result.estimated_net_pay).toBe(560)
    expect(result.effective_hourly_rate).toBe(140)
    expect(result.economics_basis).toBe('all_in_net')
    expect(result.economics_breakdown.complete).toBe(true)
  })

  it('uses on-site gross rate when travel time is unknown', () => {
    const result = calculateManagerEconomics({
      compensation_min: 825,
      expected_work_hours: 5,
    })

    expect(result.expected_total_hours).toBeNull()
    expect(result.estimated_net_pay).toBeNull()
    expect(result.effective_hourly_rate).toBe(165)
    expect(result.economics_basis).toBe('on_site_gross')
    expect(result.economics_breakdown.complete).toBe(false)
  })

  it('does not invent net pay when travel cost is unknown', () => {
    const result = calculateManagerEconomics({
      compensation_min: 500,
      expected_work_hours: 2,
      travel_minutes: 20,
      travel_covered: false,
    })

    expect(result.estimated_net_pay).toBeNull()
    expect(result.economics_basis).toBe('all_in_gross')
  })

  it('treats covered travel as no out-of-pocket travel deduction', () => {
    const result = calculateManagerEconomics({
      compensation_min: 500,
      expected_work_hours: 2,
      travel_minutes: 30,
      travel_cost_estimate: 75,
      travel_covered: true,
    })

    expect(result.estimated_net_pay).toBe(500)
    expect(result.expected_total_hours).toBe(3)
    expect(result.effective_hourly_rate).toBeCloseTo(166.67)
    expect(result.economics_basis).toBe('all_in_net')
  })
})
