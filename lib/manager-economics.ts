export const MANAGER_ECONOMICS_VERSION = 'v1'

export type ManagerEconomicsBasis =
  | 'unknown'
  | 'on_site_gross'
  | 'all_in_gross'
  | 'all_in_net'

type ManagerEconomicsInput = {
  compensation_min?: number | null
  expected_work_hours?: number | null
  travel_minutes?: number | null
  travel_cost_estimate?: number | null
  travel_covered?: boolean | null
}

export interface ManagerEconomicsResult {
  expected_total_hours: number | null
  estimated_net_pay: number | null
  effective_hourly_rate: number | null
  economics_basis: ManagerEconomicsBasis
  economics_breakdown: {
    version: string
    guaranteed_gross: number | null
    expected_work_hours: number | null
    one_way_travel_minutes: number | null
    round_trip_travel_hours: number | null
    expected_total_hours: number | null
    travel_cost_estimate: number | null
    travel_covered: boolean
    estimated_net_pay: number | null
    on_site_gross_hourly_rate: number | null
    effective_hourly_rate: number | null
    effective_hourly_basis: ManagerEconomicsBasis
    complete: boolean
    note: string
  }
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function round(value: number, places = 2) {
  const scale = 10 ** places
  return Math.round((value + Number.EPSILON) * scale) / scale
}

export function calculateManagerEconomics(
  input: ManagerEconomicsInput
): ManagerEconomicsResult {
  const guaranteedGross = numberOrNull(input.compensation_min)
  const workHours = numberOrNull(input.expected_work_hours)
  const oneWayTravelMinutes = numberOrNull(input.travel_minutes)
  const travelCost = numberOrNull(input.travel_cost_estimate)
  const travelCovered = Boolean(input.travel_covered)

  const roundTripTravelHours =
    oneWayTravelMinutes === null ? null : round((oneWayTravelMinutes * 2) / 60)

  const expectedTotalHours =
    workHours !== null && workHours > 0 && roundTripTravelHours !== null
      ? round(workHours + roundTripTravelHours)
      : null

  const estimatedNetPay =
    guaranteedGross === null
      ? null
      : travelCovered
        ? guaranteedGross
        : travelCost !== null
          ? round(Math.max(0, guaranteedGross - travelCost))
          : null

  const onSiteGrossHourlyRate =
    guaranteedGross !== null && workHours !== null && workHours > 0
      ? round(guaranteedGross / workHours)
      : null

  let effectiveHourlyRate: number | null = null
  let economicsBasis: ManagerEconomicsBasis = 'unknown'

  if (expectedTotalHours !== null && expectedTotalHours > 0 && guaranteedGross !== null) {
    if (estimatedNetPay !== null) {
      effectiveHourlyRate = round(estimatedNetPay / expectedTotalHours)
      economicsBasis = 'all_in_net'
    } else {
      effectiveHourlyRate = round(guaranteedGross / expectedTotalHours)
      economicsBasis = 'all_in_gross'
    }
  } else if (onSiteGrossHourlyRate !== null) {
    effectiveHourlyRate = onSiteGrossHourlyRate
    economicsBasis = 'on_site_gross'
  }

  const complete =
    guaranteedGross !== null &&
    workHours !== null &&
    workHours > 0 &&
    oneWayTravelMinutes !== null &&
    (travelCovered || travelCost !== null)

  const note =
    economicsBasis === 'all_in_net'
      ? 'Rate includes round-trip travel time and known out-of-pocket travel cost.'
      : economicsBasis === 'all_in_gross'
        ? 'Rate includes round-trip travel time; travel cost is not yet known.'
        : economicsBasis === 'on_site_gross'
          ? 'Rate uses work hours only because travel time is not yet known.'
          : 'Add guaranteed pay and expected work hours to calculate an hourly rate.'

  return {
    expected_total_hours: expectedTotalHours,
    estimated_net_pay: estimatedNetPay,
    effective_hourly_rate: effectiveHourlyRate,
    economics_basis: economicsBasis,
    economics_breakdown: {
      version: MANAGER_ECONOMICS_VERSION,
      guaranteed_gross: guaranteedGross,
      expected_work_hours: workHours,
      one_way_travel_minutes: oneWayTravelMinutes,
      round_trip_travel_hours: roundTripTravelHours,
      expected_total_hours: expectedTotalHours,
      travel_cost_estimate: travelCost,
      travel_covered: travelCovered,
      estimated_net_pay: estimatedNetPay,
      on_site_gross_hourly_rate: onSiteGrossHourlyRate,
      effective_hourly_rate: effectiveHourlyRate,
      effective_hourly_basis: economicsBasis,
      complete,
      note,
    },
  }
}
