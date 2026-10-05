export const MANAGER_FIT_SCORE_VERSION = 'v2'

type ManagerProfileForScoring = {
  home_market?: string | null
  minimum_fee?: number | null
  target_hourly_rate?: number | null
  max_drive_minutes?: number | null
  preferred_event_types?: string[] | null
  excluded_event_types?: string[] | null
  genres?: string[] | null
}

type ManagerOpportunityForScoring = {
  title?: string | null
  organization?: string | null
  venue_name?: string | null
  location_city?: string | null
  location_state?: string | null
  compensation_min?: number | null
  compensation_max?: number | null
  travel_minutes?: number | null
  travel_covered?: boolean | null
  effective_hourly_rate?: number | null
  economics_basis?: string | null
  requirements?: string | null
  why_fit?: string | null
  recommended_demo?: string | null
  source_url?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  event_date?: string | null
  application_deadline?: string | null
}

export interface ManagerFitScoreResult {
  score: number
  version: string
  breakdown: {
    pay: { score: number; max: 30; note: string }
    travel: { score: number; max: 25; note: string }
    eventFit: { score: number; max: 20; note: string }
    musicFit: { score: number; max: 15; note: string }
    readiness: { score: number; max: 10; note: string }
    flags: string[]
  }
}

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function hourlyBasisLabel(value: string | null | undefined) {
  if (value === 'all_in_net') return 'all-in net'
  if (value === 'all_in_gross') return 'all-in gross'
  if (value === 'on_site_gross') return 'on-site gross'
  return 'estimated'
}

export function scoreManagerOpportunity(
  profile: ManagerProfileForScoring,
  opportunity: ManagerOpportunityForScoring
): ManagerFitScoreResult {
  const minimumFee = numberOrNull(profile.minimum_fee)
  const targetHourlyRate = numberOrNull(profile.target_hourly_rate)
  const maxDriveMinutes = numberOrNull(profile.max_drive_minutes)
  const compMin = numberOrNull(opportunity.compensation_min)
  const compMax = numberOrNull(opportunity.compensation_max)
  const effectiveHourlyRate = numberOrNull(opportunity.effective_hourly_rate)
  const travelMinutes = numberOrNull(opportunity.travel_minutes)
  const flags: string[] = []

  let payScore = 15
  let payNote = 'Pay is unknown; neutral score.'

  if (minimumFee !== null && (compMin !== null || compMax !== null)) {
    if (compMax !== null && compMax < minimumFee) {
      payScore = 0
      payNote = `Known pay is below the ${formatMoney(minimumFee)} minimum.`
      flags.push('below_minimum_fee')
    } else if (compMin !== null && compMin < minimumFee) {
      payScore = 12
      payNote = `Pay can reach the ${formatMoney(minimumFee)} minimum, but the guaranteed floor is lower.`
      flags.push('pay_floor_below_minimum')
    } else if (compMin !== null && compMin >= minimumFee) {
      payScore = 20
      payNote = `Guaranteed pay meets the ${formatMoney(minimumFee)} minimum; hourly economics are incomplete.`

      if (targetHourlyRate !== null && effectiveHourlyRate !== null) {
        const ratio = targetHourlyRate === 0 ? 1 : effectiveHourlyRate / targetHourlyRate

        if (ratio >= 1) payScore = 30
        else if (ratio >= 0.75) payScore = 26
        else if (ratio >= 0.5) payScore = 22
        else if (ratio >= 0.33) payScore = 18
        else payScore = 12

        payNote =
          `${formatMoney(effectiveHourlyRate)}/hr ${hourlyBasisLabel(opportunity.economics_basis)} vs ` +
          `${formatMoney(targetHourlyRate)}/hr target; guaranteed fee still meets the ${formatMoney(minimumFee)} minimum.`

        if (effectiveHourlyRate < targetHourlyRate) {
          flags.push('below_target_hourly')
        }
      }
    } else if (compMax !== null && compMax >= minimumFee) {
      payScore = 12
      payNote = `Pay may meet the ${formatMoney(minimumFee)} minimum, but no guaranteed floor is known.`
      flags.push('pay_floor_unknown')
    }
  } else if (targetHourlyRate !== null && effectiveHourlyRate !== null) {
    const ratio = targetHourlyRate === 0 ? 1 : effectiveHourlyRate / targetHourlyRate
    payScore = ratio >= 1 ? 30 : ratio >= 0.75 ? 26 : ratio >= 0.5 ? 22 : ratio >= 0.33 ? 18 : 12
    payNote = `${formatMoney(effectiveHourlyRate)}/hr ${hourlyBasisLabel(opportunity.economics_basis)} vs ${formatMoney(targetHourlyRate)}/hr target.`
    if (effectiveHourlyRate < targetHourlyRate) flags.push('below_target_hourly')
  }

  const homeMarket = normalize(profile.home_market)
  const opportunityMarket = normalize(
    [opportunity.location_city, opportunity.location_state].filter(Boolean).join(', ')
  )
  let travelScore = 12
  let travelNote = 'Travel requirement is unknown; neutral score.'
  if (homeMarket && opportunityMarket && homeMarket === opportunityMarket) {
    travelScore = 25
    travelNote = 'Opportunity is in the home market.'
  } else if (travelMinutes !== null && maxDriveMinutes !== null) {
    if (travelMinutes <= maxDriveMinutes) {
      travelScore = 25
      travelNote = `One-way travel is within the ${maxDriveMinutes}-minute limit.`
    } else if (opportunity.travel_covered) {
      travelScore = 15
      travelNote = `One-way travel exceeds ${maxDriveMinutes} minutes, but travel is covered.`
    } else {
      travelScore = 0
      travelNote = `One-way travel exceeds the ${maxDriveMinutes}-minute limit without confirmed coverage.`
      flags.push('travel_over_limit')
    }
  } else if (opportunity.travel_covered) {
    travelScore = 17
    travelNote = 'Travel time is unknown, but travel is covered.'
  }

  const haystack = normalize([
    opportunity.title,
    opportunity.organization,
    opportunity.venue_name,
    opportunity.requirements,
    opportunity.why_fit,
    opportunity.recommended_demo,
  ].filter(Boolean).join(' '))

  const preferred = (profile.preferred_event_types ?? []).map(normalize).filter(Boolean)
  const excluded = (profile.excluded_event_types ?? []).map(normalize).filter(Boolean)
  const preferredMatch = preferred.find((term) => haystack.includes(term))
  const excludedMatch = excluded.find((term) => haystack.includes(term))

  let eventFitScore = 10
  let eventFitNote = 'No explicit preferred/excluded event-type match.'
  if (excludedMatch) {
    eventFitScore = 0
    eventFitNote = `Matches excluded event type: ${excludedMatch}.`
    flags.push('excluded_event_type')
  } else if (preferredMatch) {
    eventFitScore = 20
    eventFitNote = `Matches preferred event type: ${preferredMatch}.`
  }

  const genres = (profile.genres ?? []).map(normalize).filter(Boolean)
  const genreMatch = genres.find((term) => haystack.includes(term))
  const musicFitScore = genreMatch ? 15 : 7
  const musicFitNote = genreMatch
    ? `Matches saved music profile: ${genreMatch}.`
    : 'No explicit saved-genre match found in the opportunity text.'

  let readinessScore = 0
  const readiness: string[] = []
  if (opportunity.source_url) {
    readinessScore += 5
    readiness.push('source')
  }
  if (
    opportunity.contact_name ||
    opportunity.contact_email ||
    opportunity.contact_phone ||
    opportunity.event_date ||
    opportunity.application_deadline ||
    compMin !== null ||
    compMax !== null
  ) {
    readinessScore += 5
    readiness.push('actionable details')
  }
  const readinessNote = readiness.length
    ? `Has ${readiness.join(' + ')}.`
    : 'Few actionable details are known yet.'

  let score = payScore + travelScore + eventFitScore + musicFitScore + readinessScore
  if (flags.includes('travel_over_limit')) score = Math.min(score, 50)
  if (flags.includes('excluded_event_type')) score = Math.min(score, 50)
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score,
    version: MANAGER_FIT_SCORE_VERSION,
    breakdown: {
      pay: { score: payScore, max: 30, note: payNote },
      travel: { score: travelScore, max: 25, note: travelNote },
      eventFit: { score: eventFitScore, max: 20, note: eventFitNote },
      musicFit: { score: musicFitScore, max: 15, note: musicFitNote },
      readiness: { score: readinessScore, max: 10, note: readinessNote },
      flags,
    },
  }
}
