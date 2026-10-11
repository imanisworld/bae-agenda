import { readFileSync } from 'node:fs'
import path from 'node:path'
import { scoreManagerOpportunity } from '@/lib/manager-scoring'
import { managerSignalCanBecomeOpportunity } from '@/lib/manager-source-health'
import { hasRecurringRelationshipEvidence } from '@/lib/manager-relationship-intelligence'
import { splitManagerAsks } from '@/lib/manager-asks'
import { summarizeManagerSourceSignals } from '@/lib/manager-source-quality'
import type { ManagerSourceSignalStatus } from '@/lib/manager-source-quality'

export const BENCHMARK_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..'
)

export const DECISION_FIELDS = [
  'organization',
  'venue_name',
  'event_date',
  'application_deadline',
  'compensation_min',
  'compensation_max',
  'requirements',
  'contact_name',
  'contact_email',
  'contact_phone',
] as const

export type DecisionField = (typeof DECISION_FIELDS)[number]

export type LeadClassification =
  | 'direct_buyer'
  | 'staffing_or_roster'
  | 'wedding_dj_employment'
  | 'directory_listing'
  | 'relationship_only'
  | 'not_a_lead'

export type ActivityLabel = 'active' | 'closed' | 'expired' | 'unknown'

export type EvidenceQuote = {
  field: DecisionField | 'activity' | 'recurring' | 'buyer' | 'classification' | 'claim'
  quote: string
  url: string
}

export type ObservedLead = {
  id: string
  task_id: string
  title: string
  organization: string | null
  venue_name: string | null
  location_city: string | null
  location_state: string | null
  event_date: string | null
  application_deadline: string | null
  compensation_min: number | null
  compensation_max: number | null
  requirements: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  source_url: string | null
  source_kind: 'venue' | 'dj' | 'promoter' | 'event_brand' | 'brand' | 'agency' | 'other'
  signal_type: 'post' | 'event' | 'booking_call' | 'job' | 'application' | 'venue_programming' | 'other'
  actionable: boolean | null
  classification: LeadClassification
  activity: ActivityLabel
  recurring_label: boolean
  presented_as_useful: boolean
  duplicate_of: string | null
  /** Same calendar URL can list different events. Those records are not reposts. */
  same_url_is_distinct_event: boolean
  evidence: EvidenceQuote[]
  why_fit: string | null
}

export type ScoringProfile = {
  home_market: string
  minimum_fee: number
  target_hourly_rate: number
  max_drive_minutes: number
  preferred_event_types: string[]
  excluded_event_types: string[]
  genres: string[]
}

export type TaskMetrics = {
  task_id: string
  useful_leads: number
  valid_original_sources: number
  duplicates: number
  stale_or_expired: number
  false_positives: number
  unsupported_or_invented_details: number
  buyer_contact_clarity: {
    evidenced: number
    claimed_without_evidence: number
    unknown: number
  }
  requirements_completeness: {
    with_asks: number
    empty: number
  }
  annual_or_recurring_detection: {
    labeled_recurring: number
    code_agrees: number
    code_disagrees: number
  }
  code_would_create_opportunity: number
  code_blocked_opportunity: number
}

export type BenchmarkMetrics = {
  tasks: TaskMetrics[]
  totals: Omit<TaskMetrics, 'task_id' | 'buyer_contact_clarity' | 'requirements_completeness' | 'annual_or_recurring_detection'> & {
    buyer_contact_clarity: TaskMetrics['buyer_contact_clarity']
    requirements_completeness: TaskMetrics['requirements_completeness']
    annual_or_recurring_detection: TaskMetrics['annual_or_recurring_detection']
  }
  source_quality: ReturnType<typeof summarizeManagerSourceSignals>
  duplicate_groups: string[][]
  false_positive_ids: string[]
  unsupported_fields: { lead_id: string; field: DecisionField }[]
}

const AS_OF = '2026-10-11'

const EXCLUDED_CLASSIFICATIONS = new Set<LeadClassification>([
  'staffing_or_roster',
  'wedding_dj_employment',
])

export function canonicalUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    const pathName = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${pathName}${parsed.search}`
  } catch {
    return url.trim().toLowerCase()
  }
}

function normalizeOrg(value: string | null) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function hasEvidence(lead: ObservedLead, field: EvidenceQuote['field']) {
  return lead.evidence.some(
    (item) => item.field === field && item.quote.trim().length > 0 && item.url.trim().length > 0
  )
}

export function unsupportedFields(lead: ObservedLead): DecisionField[] {
  return DECISION_FIELDS.filter((field) => {
    const value = lead[field]
    if (value === null || value === '') return false
    return !hasEvidence(lead, field)
  })
}

function isExcludedClassification(classification: LeadClassification) {
  switch (classification) {
    case 'staffing_or_roster':
    case 'wedding_dj_employment':
      return true
    case 'direct_buyer':
    case 'directory_listing':
    case 'relationship_only':
    case 'not_a_lead':
      return false
    default: {
      const never: never = classification
      return never
    }
  }
}

function activityIsStale(activity: ActivityLabel) {
  switch (activity) {
    case 'closed':
    case 'expired':
      return true
    case 'active':
    case 'unknown':
      return false
    default: {
      const never: never = activity
      return never
    }
  }
}

export function buildDuplicateGroups(leads: ObservedLead[]): string[][] {
  const parent = new Map<string, string>()
  const find = (id: string): string => {
    const current = parent.get(id) ?? id
    if (current === id) return id
    const root = find(current)
    parent.set(id, root)
    return root
  }
  const union = (a: string, b: string) => {
    const left = find(a)
    const right = find(b)
    if (left !== right) parent.set(right, left)
  }

  for (const lead of leads) parent.set(lead.id, lead.id)

  const byUrl = new Map<string, string[]>()
  for (const lead of leads) {
    if (lead.same_url_is_distinct_event) continue
    const url = canonicalUrl(lead.source_url)
    if (!url) continue
    const list = byUrl.get(url) ?? []
    list.push(lead.id)
    byUrl.set(url, list)
  }
  for (const ids of byUrl.values()) {
    for (const id of ids.slice(1)) union(ids[0], id)
  }

  const byId = new Map(leads.map((lead) => [lead.id, lead]))
  for (const lead of leads) {
    if (!lead.duplicate_of) continue
    const other = byId.get(lead.duplicate_of)
    if (!other) continue
    const leftOrg = normalizeOrg(lead.organization)
    const rightOrg = normalizeOrg(other.organization)
    if (leftOrg && rightOrg && leftOrg !== rightOrg) continue
    union(lead.id, lead.duplicate_of)
  }

  const groups = new Map<string, string[]>()
  for (const lead of leads) {
    const root = find(lead.id)
    const list = groups.get(root) ?? []
    list.push(lead.id)
    groups.set(root, list)
  }
  return [...groups.values()].filter((group) => group.length > 1).sort((a, b) => a[0].localeCompare(b[0]))
}

function signalStatus(lead: ObservedLead): ManagerSourceSignalStatus {
  if (isExcludedClassification(lead.classification) || lead.classification === 'not_a_lead') return 'ignored'
  if (lead.presented_as_useful && lead.classification === 'direct_buyer') return 'relevant'
  if (lead.classification === 'relationship_only' || lead.classification === 'directory_listing') return 'relevant'
  return 'new'
}

function dateBeforeAsOf(value: string | null) {
  return Boolean(value && value < AS_OF)
}

export function scoreObservedLead(profile: ScoringProfile, lead: ObservedLead) {
  const fit = scoreManagerOpportunity(profile, {
    title: lead.title,
    organization: lead.organization,
    venue_name: lead.venue_name,
    location_city: lead.location_city,
    location_state: lead.location_state,
    compensation_min: lead.compensation_min,
    compensation_max: lead.compensation_max,
    requirements: lead.requirements,
    why_fit: lead.why_fit,
    source_url: lead.source_url,
    contact_name: lead.contact_name,
    contact_email: lead.contact_email,
    contact_phone: lead.contact_phone,
    event_date: lead.event_date,
    application_deadline: lead.application_deadline,
  })

  const canBecomeOpportunity = managerSignalCanBecomeOpportunity({
    signal_type: lead.signal_type,
    source_kind: lead.source_kind,
    source_payload: {
      actionable: lead.actionable ?? undefined,
      lead_strength: lead.classification === 'relationship_only' ? 'relationship_signal' : undefined,
    },
  })

  const recurringEvidence = hasRecurringRelationshipEvidence(
    {
      id: lead.id,
      source_id: 'benchmark',
      signal_type: lead.signal_type,
      status: signalStatus(lead) === 'ignored' ? 'ignored' : 'relevant',
      title: lead.title,
      url: lead.source_url,
      published_at: lead.event_date,
      discovered_at: `${AS_OF}T00:00:00Z`,
      summary: lead.requirements,
      linked_opportunity_id: null,
      source_payload: {
        classification: lead.classification,
      },
    },
    {
      id: 'benchmark',
      name: lead.organization ?? lead.title,
      source_kind: lead.source_kind,
      url: lead.source_url ?? '',
      location_city: lead.location_city,
      location_state: lead.location_state,
      notes: lead.why_fit,
    }
  )

  return { fit, canBecomeOpportunity, recurringEvidence, asks: splitManagerAsks(lead.requirements) }
}

export function isFalsePositive(lead: ObservedLead, codeBlocked: boolean): boolean {
  if (lead.presented_as_useful && isExcludedClassification(lead.classification)) return true
  if (lead.presented_as_useful && lead.classification === 'not_a_lead') return true
  if (lead.presented_as_useful && lead.classification === 'directory_listing') return true
  if (lead.presented_as_useful && lead.classification === 'relationship_only' && lead.signal_type === 'booking_call') {
    return true
  }
  if (lead.presented_as_useful && activityIsStale(lead.activity) && lead.activity !== 'unknown') {
    if (lead.classification === 'direct_buyer' && lead.signal_type !== 'venue_programming') return true
  }
  if (lead.presented_as_useful && codeBlocked && EXCLUDED_CLASSIFICATIONS.has(lead.classification)) return true
  if (lead.activity === 'active' && (dateBeforeAsOf(lead.event_date) || dateBeforeAsOf(lead.application_deadline))) {
    return true
  }
  return false
}

export function isUsefulLead(lead: ObservedLead): boolean {
  if (!lead.presented_as_useful) return false
  if (lead.classification !== 'direct_buyer' && lead.classification !== 'relationship_only') return false
  if (!lead.source_url) return false
  if (lead.evidence.length === 0) return false
  if (unsupportedFields(lead).length > 0) return false
  if (lead.classification === 'direct_buyer' && activityIsStale(lead.activity)) return false
  if (lead.classification === 'direct_buyer' && dateBeforeAsOf(lead.event_date)) return false
  if (lead.classification === 'direct_buyer' && dateBeforeAsOf(lead.application_deadline) && lead.activity !== 'unknown') {
    return false
  }
  return true
}

function emptyTask(taskId: string): TaskMetrics {
  return {
    task_id: taskId,
    useful_leads: 0,
    valid_original_sources: 0,
    duplicates: 0,
    stale_or_expired: 0,
    false_positives: 0,
    unsupported_or_invented_details: 0,
    buyer_contact_clarity: { evidenced: 0, claimed_without_evidence: 0, unknown: 0 },
    requirements_completeness: { with_asks: 0, empty: 0 },
    annual_or_recurring_detection: { labeled_recurring: 0, code_agrees: 0, code_disagrees: 0 },
    code_would_create_opportunity: 0,
    code_blocked_opportunity: 0,
  }
}

export function scoreBenchmark(profile: ScoringProfile, leads: ObservedLead[]): BenchmarkMetrics {
  const taskIds = [...new Set(leads.map((lead) => lead.task_id))]
  const tasks = new Map(taskIds.map((id) => [id, emptyTask(id)]))
  const falsePositiveIds: string[] = []
  const unsupported: BenchmarkMetrics['unsupported_fields'] = []
  const fetchedSources = new Map<string, Set<string>>()

  for (const lead of leads) {
    const task = tasks.get(lead.task_id) ?? emptyTask(lead.task_id)
    tasks.set(lead.task_id, task)
    const judged = scoreObservedLead(profile, lead)
    const missing = unsupportedFields(lead)
    task.unsupported_or_invented_details += missing.length
    for (const field of missing) unsupported.push({ lead_id: lead.id, field })

    if (isUsefulLead(lead)) task.useful_leads += 1
    if (lead.source_url && lead.evidence.some((item) => item.url && item.quote.trim())) {
      const bucket = fetchedSources.get(lead.task_id) ?? new Set<string>()
      const url = canonicalUrl(lead.source_url)
      if (url) bucket.add(url)
      fetchedSources.set(lead.task_id, bucket)
    }
    if (activityIsStale(lead.activity) || dateBeforeAsOf(lead.event_date) || dateBeforeAsOf(lead.application_deadline)) {
      task.stale_or_expired += 1
    }
    if (isFalsePositive(lead, !judged.canBecomeOpportunity)) {
      task.false_positives += 1
      falsePositiveIds.push(lead.id)
    }

    const buyerClaimed = Boolean(lead.contact_name || lead.contact_email || lead.contact_phone || lead.organization)
    const buyerEvidenced =
      hasEvidence(lead, 'buyer') ||
      hasEvidence(lead, 'organization') ||
      hasEvidence(lead, 'contact_name') ||
      hasEvidence(lead, 'contact_email') ||
      hasEvidence(lead, 'contact_phone')
    if (buyerEvidenced) task.buyer_contact_clarity.evidenced += 1
    else if (buyerClaimed) task.buyer_contact_clarity.claimed_without_evidence += 1
    else task.buyer_contact_clarity.unknown += 1

    if (judged.asks.length > 0 && hasEvidence(lead, 'requirements')) task.requirements_completeness.with_asks += 1
    else task.requirements_completeness.empty += 1

    if (lead.recurring_label) task.annual_or_recurring_detection.labeled_recurring += 1
    if (lead.recurring_label === judged.recurringEvidence) task.annual_or_recurring_detection.code_agrees += 1
    else task.annual_or_recurring_detection.code_disagrees += 1

    if (judged.canBecomeOpportunity && lead.presented_as_useful) task.code_would_create_opportunity += 1
    if (!judged.canBecomeOpportunity) task.code_blocked_opportunity += 1
  }

  for (const [taskId, urls] of fetchedSources) {
    const task = tasks.get(taskId)
    if (task) task.valid_original_sources = urls.size
  }

  const groups = buildDuplicateGroups(leads)
  const byId = new Map(leads.map((lead) => [lead.id, lead]))
  for (const group of groups) {
    const taskId = byId.get(group[0])?.task_id
    const task = taskId ? tasks.get(taskId) : undefined
    if (task) task.duplicates += 1
  }

  const taskList = [...tasks.values()].sort((a, b) => a.task_id.localeCompare(b.task_id))
  const totals = emptyTask('all')
  for (const task of taskList) {
    totals.useful_leads += task.useful_leads
    totals.valid_original_sources += task.valid_original_sources
    totals.duplicates += task.duplicates
    totals.stale_or_expired += task.stale_or_expired
    totals.false_positives += task.false_positives
    totals.unsupported_or_invented_details += task.unsupported_or_invented_details
    totals.buyer_contact_clarity.evidenced += task.buyer_contact_clarity.evidenced
    totals.buyer_contact_clarity.claimed_without_evidence += task.buyer_contact_clarity.claimed_without_evidence
    totals.buyer_contact_clarity.unknown += task.buyer_contact_clarity.unknown
    totals.requirements_completeness.with_asks += task.requirements_completeness.with_asks
    totals.requirements_completeness.empty += task.requirements_completeness.empty
    totals.annual_or_recurring_detection.labeled_recurring += task.annual_or_recurring_detection.labeled_recurring
    totals.annual_or_recurring_detection.code_agrees += task.annual_or_recurring_detection.code_agrees
    totals.annual_or_recurring_detection.code_disagrees += task.annual_or_recurring_detection.code_disagrees
    totals.code_would_create_opportunity += task.code_would_create_opportunity
    totals.code_blocked_opportunity += task.code_blocked_opportunity
  }

  return {
    tasks: taskList,
    totals,
    source_quality: summarizeManagerSourceSignals(leads.map(signalStatus)),
    duplicate_groups: groups,
    false_positive_ids: falsePositiveIds,
    unsupported_fields: unsupported,
  }
}

export function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(BENCHMARK_ROOT, relativePath), 'utf8')) as T
}
