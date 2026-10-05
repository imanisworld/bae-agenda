'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import {
  MANAGER_ACTIVITY_TYPES,
  MANAGER_ACTIVITY_TYPE_LABELS,
} from '@/lib/manager'
import { logManagerOpportunityActivity } from '@/lib/manager-activity'
import { createAdminClient } from '@/lib/supabase/admin'
import { toEventISO } from '@/lib/date-time'
import { defaultManagerSecondFollowUpDate } from '@/lib/manager-follow-up'

const ActivitySchema = z.object({
  opportunity_id: z.string().uuid(),
  activity_type: z.enum(MANAGER_ACTIVITY_TYPES),
  body: z.string().trim().max(8000).optional().default(''),
  occurred_at: z.string().trim().optional().default(''),
})

function redirectWithError(opportunityId: string, message: string): never {
  redirect(
    `/admin/manager/opportunities/${opportunityId}?error=${encodeURIComponent(message)}`
  )
}

function normalizeOccurredAt(value: string) {
  if (!value) return new Date().toISOString()

  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(value)
  if (!match) return null

  return toEventISO(
    match[1],
    'America/Indiana/Indianapolis',
    match[2]
  )
}

export async function addManagerOpportunityActivityAction(formData: FormData) {
  await requireAdminUser()

  const parsed = ActivitySchema.safeParse({
    opportunity_id: formData.get('opportunity_id'),
    activity_type: formData.get('activity_type'),
    body: formData.get('body'),
    occurred_at: formData.get('occurred_at'),
  })

  const rawId = String(formData.get('opportunity_id') ?? '')
  if (!parsed.success) {
    redirectWithError(
      rawId,
      parsed.error.issues[0]?.message ?? 'Invalid activity details.'
    )
  }

  const data = parsed.data
  const occurredAt = normalizeOccurredAt(data.occurred_at)
  if (!occurredAt) {
    redirectWithError(data.opportunity_id, 'Enter a valid activity date and time.')
  }

  const admin = createAdminClient()
  const { data: opportunity, error: opportunityError } = await admin
    .from('manager_opportunities')
    .select('id, status, applied_at, last_contacted_at, next_action, next_action_at')
    .eq('id', data.opportunity_id)
    .maybeSingle()

  if (opportunityError || !opportunity) {
    redirectWithError(
      data.opportunity_id,
      opportunityError?.message ?? 'Opportunity not found.'
    )
  }

  const saved = await logManagerOpportunityActivity(admin, {
    opportunityId: data.opportunity_id,
    activityType: data.activity_type,
    title: MANAGER_ACTIVITY_TYPE_LABELS[data.activity_type],
    body: data.body || null,
    occurredAt,
  })

  if (!saved) {
    redirectWithError(data.opportunity_id, 'Activity could not be saved.')
  }

  const lifecycleUpdate: Record<string, string | null> = {}

  if (data.activity_type === 'application' && !opportunity.applied_at) {
    lifecycleUpdate.applied_at = occurredAt
  }

  if (data.activity_type === 'contact' || data.activity_type === 'follow_up') {
    const prior = opportunity.last_contacted_at
      ? new Date(opportunity.last_contacted_at).getTime()
      : 0
    if (new Date(occurredAt).getTime() >= prior) {
      lifecycleUpdate.last_contacted_at = occurredAt
    }
  }

  if (data.activity_type === 'response') {
    lifecycleUpdate.next_action = null
    lifecycleUpdate.next_action_at = null
  }

  if (data.activity_type === 'negotiation') {
    lifecycleUpdate.status = 'negotiating'
    lifecycleUpdate.next_action = 'Continue negotiation.'
    lifecycleUpdate.next_action_at = null
  }

  if (data.activity_type === 'follow_up') {
    lifecycleUpdate.status = 'follow_up'
    lifecycleUpdate.next_action = 'Follow up again if there is still no response.'
    lifecycleUpdate.next_action_at = defaultManagerSecondFollowUpDate(new Date(occurredAt))
  }

  if (Object.keys(lifecycleUpdate).length > 0) {
    const { error } = await admin
      .from('manager_opportunities')
      .update(lifecycleUpdate)
      .eq('id', data.opportunity_id)

    if (error) {
      console.error('[manager-activity] unable to sync lifecycle timestamp:', error.message)
    }
  }

  if (
    (data.activity_type === 'negotiation' && opportunity.status !== 'negotiating') ||
    (data.activity_type === 'follow_up' && opportunity.status !== 'follow_up')
  ) {
    const nextStatus = data.activity_type === 'negotiation' ? 'negotiating' : 'follow_up'
    await logManagerOpportunityActivity(admin, {
      opportunityId: data.opportunity_id,
      activityType: 'status_change',
      title: 'Pipeline status changed',
      body: `${opportunity.status} → ${nextStatus}`,
      occurredAt,
      fromStatus: opportunity.status,
      toStatus: nextStatus,
      metadata: { reason: `manual_${data.activity_type}_activity` },
    })
  }

  revalidatePath('/admin/manager')
  revalidatePath(`/admin/manager/opportunities/${data.opportunity_id}`)
  redirect(
    `/admin/manager/opportunities/${data.opportunity_id}?success=${encodeURIComponent('Activity added.')}`
  )
}
