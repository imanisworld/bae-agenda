export type ManagerNegotiationDecision = 'accept' | 'counter' | 'pass' | 'needs_info'

type ManagerNegotiationProfile = {
  minimum_fee?: number | null
  target_hourly_rate?: number | null
  max_drive_minutes?: number | null
}

type ManagerNegotiationOpportunity = {
  title?: string | null
  organization?: string | null
  compensation_min?: number | null
  compensation_max?: number | null
  expected_work_hours?: number | null
  travel_minutes?: number | null
  travel_cost_estimate?: number | null
  travel_covered?: boolean | null
  effective_hourly_rate?: number | null
  economics_basis?: string | null
}

export type ManagerNegotiationResult = {
  decision: ManagerNegotiationDecision
  label: string
  reasons: string[]
  missing: string[]
  suggested_counter_fee: number | null
  counter_draft: string | null
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function roundUpTo25(value: number) {
  return Math.ceil(value / 25) * 25
}

function rateBasis(value: string | null | undefined) {
  if (value === 'all_in_net') return 'all-in net'
  if (value === 'all_in_gross') return 'all-in gross'
  if (value === 'on_site_gross') return 'on-site gross'
  return 'estimated'
}

export function buildManagerNegotiation(
  profile: ManagerNegotiationProfile,
  opportunity: ManagerNegotiationOpportunity
): ManagerNegotiationResult {
  const minimumFee = num(profile.minimum_fee)
  const targetHourly = num(profile.target_hourly_rate)
  const maxDrive = num(profile.max_drive_minutes)
  const guaranteed = num(opportunity.compensation_min)
  const maximum = num(opportunity.compensation_max)
  const workHours = num(opportunity.expected_work_hours)
  const travelMinutes = num(opportunity.travel_minutes)
  const travelCost = num(opportunity.travel_cost_estimate)
  const effectiveRate = num(opportunity.effective_hourly_rate)
  const travelCovered = Boolean(opportunity.travel_covered)

  const reasons: string[] = []
  const missing: string[] = []

  if (guaranteed === null) missing.push('guaranteed pay')
  if (workHours === null || workHours <= 0) missing.push('expected work hours')
  if (travelMinutes === null) missing.push('one-way travel time')

  const travelOverLimit =
    travelMinutes !== null &&
    maxDrive !== null &&
    travelMinutes > maxDrive &&
    !travelCovered

  if (maximum !== null && minimumFee !== null && maximum < minimumFee) {
    reasons.push(
      `Known maximum pay ${money(maximum)} is below the ${money(minimumFee)} minimum fee.`
    )
    return {
      decision: 'pass',
      label: 'Pass',
      reasons,
      missing,
      suggested_counter_fee: null,
      counter_draft: null,
    }
  }

  if (travelOverLimit) {
    reasons.push(
      `One-way travel is ${travelMinutes} minutes, above the ${maxDrive}-minute limit, with no confirmed travel coverage.`
    )
    return {
      decision: 'pass',
      label: 'Pass',
      reasons,
      missing,
      suggested_counter_fee: null,
      counter_draft: null,
    }
  }

  let suggestedCounter: number | null = minimumFee

  if (targetHourly !== null && workHours !== null && workHours > 0) {
    const roundTripTravelHours =
      travelMinutes === null ? 0 : (travelMinutes * 2) / 60
    const targetHours = workHours + roundTripTravelHours
    let grossNeeded = targetHourly * targetHours

    if (!travelCovered && travelCost !== null) {
      grossNeeded += travelCost
    }

    suggestedCounter = roundUpTo25(
      Math.max(grossNeeded, minimumFee ?? 0)
    )
  }

  if (
    guaranteed !== null &&
    minimumFee !== null &&
    guaranteed < minimumFee
  ) {
    reasons.push(
      `Guaranteed pay ${money(guaranteed)} is below the ${money(minimumFee)} minimum fee.`
    )
    const counter = suggestedCounter ?? minimumFee
    return {
      decision: 'counter',
      label: 'Counter',
      reasons,
      missing,
      suggested_counter_fee: counter,
      counter_draft: buildManagerCounterDraft(opportunity, counter),
    }
  }

  if (
    guaranteed !== null &&
    minimumFee !== null &&
    guaranteed >= minimumFee &&
    targetHourly !== null &&
    effectiveRate !== null
  ) {
    if (effectiveRate >= targetHourly) {
      reasons.push(
        `${money(effectiveRate)}/hr ${rateBasis(opportunity.economics_basis)} meets the ${money(targetHourly)}/hr target.`
      )
      reasons.push(
        `Guaranteed pay ${money(guaranteed)} meets the ${money(minimumFee)} minimum fee.`
      )
      return {
        decision: 'accept',
        label: 'Accept',
        reasons,
        missing,
        suggested_counter_fee: null,
        counter_draft: null,
      }
    }

    reasons.push(
      `${money(effectiveRate)}/hr ${rateBasis(opportunity.economics_basis)} is below the ${money(targetHourly)}/hr target.`
    )
    reasons.push(
      `Guaranteed pay still meets the ${money(minimumFee)} minimum fee, so this is a counter rather than an automatic pass.`
    )

    return {
      decision: 'counter',
      label: 'Counter',
      reasons,
      missing,
      suggested_counter_fee: suggestedCounter,
      counter_draft:
        suggestedCounter === null
          ? null
          : buildManagerCounterDraft(opportunity, suggestedCounter),
    }
  }

  if (missing.length > 0) {
    reasons.push(
      'There is not enough verified information to judge the offer against both the minimum fee and hourly target.'
    )
    return {
      decision: 'needs_info',
      label: 'Needs Info',
      reasons,
      missing,
      suggested_counter_fee:
        guaranteed !== null && minimumFee !== null && guaranteed < minimumFee
          ? suggestedCounter
          : null,
      counter_draft: null,
    }
  }

  reasons.push('Known terms do not trigger an accept, counter, or pass rule yet.')
  return {
    decision: 'needs_info',
    label: 'Needs Info',
    reasons,
    missing,
    suggested_counter_fee: null,
    counter_draft: null,
  }
}

export function buildManagerCounterDraft(
  opportunity: ManagerNegotiationOpportunity,
  counterFee: number
) {
  const subject = opportunity.title?.trim() || 'the event'
  const organization = opportunity.organization?.trim()
  const greeting = organization ? `Hi ${organization} team,` : 'Hi,'

  return [
    greeting,
    '',
    `Thanks for the details on ${subject}. I’d be interested in making it work. Based on the scope and logistics we have so far, my rate would be ${money(counterFee)}.`,
    '',
    'If that fits the budget, I’m happy to confirm availability and next steps.',
    '',
    'Best,',
    'DJ B.A.E.',
  ].join('\n')
}
