import type { SupabaseClient } from '@supabase/supabase-js'

export type ManagerActivityKind =
  | 'created'
  | 'research'
  | 'note'
  | 'application'
  | 'contact'
  | 'follow_up'
  | 'response'
  | 'negotiation'
  | 'status_change'
  | 'booking'
  | 'other'

export async function logManagerOpportunityActivity(
  admin: SupabaseClient,
  input: {
    opportunityId: string
    activityType: ManagerActivityKind
    title: string
    body?: string | null
    occurredAt?: string
    fromStatus?: string | null
    toStatus?: string | null
    metadata?: Record<string, unknown>
  }
) {
  const { error } = await admin
    .from('manager_opportunity_activities')
    .insert({
      opportunity_id: input.opportunityId,
      activity_type: input.activityType,
      title: input.title,
      body: input.body ?? null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      from_status: input.fromStatus ?? null,
      to_status: input.toStatus ?? null,
      metadata: input.metadata ?? {},
    })

  if (error) {
    console.error('[manager-activity] unable to save activity:', error.message)
    return false
  }

  return true
}
