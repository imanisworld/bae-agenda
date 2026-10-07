export type ManagerRelationshipStrength =
  | 'repeat_observed'
  | 'recurring_program'
  | 'single_signal'
  | 'watch_only'

export interface ManagerRelationshipSource {
  id: string
  name: string
  source_kind: string
  url: string
  location_city: string | null
  location_state: string | null
  notes: string | null
}

export interface ManagerRelationshipSignal {
  id: string
  source_id: string
  signal_type: string
  status: string
  title: string
  url: string | null
  published_at: string | null
  discovered_at: string
  summary: string | null
  linked_opportunity_id: string | null
  source_payload: Record<string, unknown> | null
}

export interface ManagerRelationshipRow {
  source: ManagerRelationshipSource
  signalCount: number
  relevantCount: number
  ignoredCount: number
  linkedOpportunityCount: number
  recurringEvidence: boolean
  strength: ManagerRelationshipStrength
  latestSignal: ManagerRelationshipSignal | null
}

const RECURRING_PATTERN =
  /\b(recurring|monthly|weekly|annual|yearly|seasonal|guest[ -]?dj|rotation|series|programming)\b/i

function signalTime(signal: ManagerRelationshipSignal) {
  return signal.published_at ?? signal.discovered_at
}

function payloadText(payload: Record<string, unknown> | null) {
  if (!payload) return ''
  return Object.values(payload)
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
}

export function hasRecurringRelationshipEvidence(
  signal: ManagerRelationshipSignal,
  source?: ManagerRelationshipSource
) {
  if (signal.status === 'ignored') return false

  const haystack = [
    signal.title,
    signal.summary,
    payloadText(signal.source_payload),
    source?.notes ?? '',
  ].join(' ')

  return RECURRING_PATTERN.test(haystack)
}

export function buildManagerRelationshipRows(
  sources: ManagerRelationshipSource[],
  signals: ManagerRelationshipSignal[]
): ManagerRelationshipRow[] {
  const bySource = new Map<string, ManagerRelationshipSignal[]>()

  for (const signal of signals) {
    const list = bySource.get(signal.source_id) ?? []
    list.push(signal)
    bySource.set(signal.source_id, list)
  }

  return sources
    .map((source) => {
      const sourceSignals = (bySource.get(source.id) ?? [])
        .slice()
        .sort((a, b) => signalTime(b).localeCompare(signalTime(a)))

      const relevant = sourceSignals.filter((signal) => signal.status !== 'ignored')
      const recurringEvidence = relevant.some((signal) =>
        hasRecurringRelationshipEvidence(signal, source)
      )
      const signalCount = sourceSignals.length
      const relevantCount = relevant.length
      const linkedOpportunityCount = relevant.filter(
        (signal) => Boolean(signal.linked_opportunity_id)
      ).length

      let strength: ManagerRelationshipStrength = 'watch_only'
      if (relevantCount >= 2) strength = 'repeat_observed'
      else if (recurringEvidence) strength = 'recurring_program'
      else if (relevantCount === 1) strength = 'single_signal'

      return {
        source,
        signalCount,
        relevantCount,
        ignoredCount: signalCount - relevantCount,
        linkedOpportunityCount,
        recurringEvidence,
        strength,
        latestSignal: relevant[0] ?? sourceSignals[0] ?? null,
      }
    })
    .sort((a, b) => {
      const rank: Record<ManagerRelationshipStrength, number> = {
        repeat_observed: 0,
        recurring_program: 1,
        single_signal: 2,
        watch_only: 3,
      }

      const strengthDiff = rank[a.strength] - rank[b.strength]
      if (strengthDiff !== 0) return strengthDiff

      const aTime = a.latestSignal ? signalTime(a.latestSignal) : ''
      const bTime = b.latestSignal ? signalTime(b.latestSignal) : ''
      return bTime.localeCompare(aTime) || a.source.name.localeCompare(b.source.name)
    })
}

export function managerRelationshipStrengthLabel(strength: ManagerRelationshipStrength) {
  if (strength === 'repeat_observed') return 'Repeated signals'
  if (strength === 'recurring_program') return 'Recurring evidence'
  if (strength === 'single_signal') return 'Single signal'
  return 'Watch only'
}
