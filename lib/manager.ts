export const MANAGER_OPPORTUNITY_TYPES = [
  'dj_gig',
  'brand_deal',
  'residency',
  'festival',
  'creator',
  'collaboration',
  'other',
] as const

export type ManagerOpportunityType = typeof MANAGER_OPPORTUNITY_TYPES[number]

export const MANAGER_SOURCE_TYPES = [
  'manual',
  'website',
  'venue',
  'dj_referral',
  'instagram',
  'x',
  'linkedin',
  'email',
  'other',
] as const

export type ManagerSourceType = typeof MANAGER_SOURCE_TYPES[number]

export const MANAGER_OPPORTUNITY_STATUSES = [
  'found',
  'qualified',
  'review',
  'outreach_ready',
  'applied',
  'contacted',
  'follow_up',
  'negotiating',
  'booked',
  'passed',
  'lost',
] as const

export type ManagerOpportunityStatus = typeof MANAGER_OPPORTUNITY_STATUSES[number]

export const MANAGER_OPPORTUNITY_TYPE_LABELS: Record<ManagerOpportunityType, string> = {
  dj_gig: 'DJ Gig',
  brand_deal: 'Brand Deal',
  residency: 'Residency',
  festival: 'Festival',
  creator: 'Creator',
  collaboration: 'Collaboration',
  other: 'Other',
}

export const MANAGER_SOURCE_TYPE_LABELS: Record<ManagerSourceType, string> = {
  manual: 'Manual',
  website: 'Website',
  venue: 'Venue',
  dj_referral: 'DJ Referral',
  instagram: 'Instagram',
  x: 'X',
  linkedin: 'LinkedIn',
  email: 'Email',
  other: 'Other',
}

export const MANAGER_STATUS_LABELS: Record<ManagerOpportunityStatus, string> = {
  found: 'Found',
  qualified: 'Qualified',
  review: 'Review',
  outreach_ready: 'Outreach Ready',
  applied: 'Applied',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  negotiating: 'Negotiating',
  booked: 'Booked',
  passed: 'Passed',
  lost: 'Lost',
}

export function isManagerOpportunityType(value: unknown): value is ManagerOpportunityType {
  return typeof value === 'string' && MANAGER_OPPORTUNITY_TYPES.includes(value as ManagerOpportunityType)
}

export function isManagerSourceType(value: unknown): value is ManagerSourceType {
  return typeof value === 'string' && MANAGER_SOURCE_TYPES.includes(value as ManagerSourceType)
}

export function isManagerOpportunityStatus(value: unknown): value is ManagerOpportunityStatus {
  return typeof value === 'string' && MANAGER_OPPORTUNITY_STATUSES.includes(value as ManagerOpportunityStatus)
}

export function managerStatusStyle(status: ManagerOpportunityStatus) {
  const styles: Record<ManagerOpportunityStatus, { color: string; bg: string; border: string }> = {
    found: { color: 'var(--gold)', bg: 'rgba(201,168,76,0.10)', border: 'rgba(201,168,76,0.30)' },
    qualified: { color: '#7dd3fc', bg: 'rgba(125,211,252,0.10)', border: 'rgba(125,211,252,0.30)' },
    review: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
    outreach_ready: { color: '#d8ba88', bg: 'rgba(216,186,136,0.10)', border: 'rgba(216,186,136,0.30)' },
    applied: { color: '#a7f3d0', bg: 'rgba(167,243,208,0.08)', border: 'rgba(167,243,208,0.26)' },
    contacted: { color: '#7dd3fc', bg: 'rgba(125,211,252,0.10)', border: 'rgba(125,211,252,0.30)' },
    follow_up: { color: '#c4a574', bg: 'rgba(196,165,116,0.10)', border: 'rgba(196,165,116,0.30)' },
    negotiating: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
    booked: { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.30)' },
    passed: { color: 'rgba(246,241,232,.55)', bg: 'rgba(246,241,232,.04)', border: 'rgba(246,241,232,.14)' },
    lost: { color: '#e85d75', bg: 'rgba(232,93,117,0.10)', border: 'rgba(232,93,117,0.30)' },
  }

  return styles[status]
}

export function splitManagerList(value: string | null | undefined): string[] {
  if (!value) return []

  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

export function joinManagerList(value: string[] | null | undefined): string {
  return (value ?? []).join(', ')
}
