'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import { logManagerOpportunityActivity } from '@/lib/manager-activity'
import { createAdminClient } from '@/lib/supabase/admin'

const DecisionSchema = z.object({
  opportunity_id: z.string().uuid(),
  decision: z.enum(['accept', 'counter', 'pass', 'needs_info']),
  proposed_fee: z.coerce.number().min(0).optional(),
  note: z.string().trim().max(8000).optional().default(''),
})

function redirectWithError(opportunityId: string, message: string): never {
  redirect(
    `/admin/manager/opportunities/${opportunityId}?error=${encodeURIComponent(message)}`
  )
}

function fmtMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

export async function recordManagerNegotiationDecisionAction(formData: FormData) {
  await requireAdminUser()

  const rawId = String(formData.get('opportunity_id') ?? '')
  const proposedRaw = String(formData.get('proposed_fee') ?? '').trim()

  const parsed = DecisionSchema.safeParse({
    opportunity_id: rawId,
    decision: formData.get('decision'),
    proposed_fee: proposedRaw === '' ? undefined : proposedRaw,
    note: formData.get('note'),
  })

  if (!parsed.success) {
    redirectWithError(
      rawId,
      parsed.error.issues[0]?.message ?? 'Invalid negotiation decision.'
    )
  }

  const data = parsed.data
  const admin = createAdminClient()
  const { data: opportunity, error } = await admin
    .from('manager_opportunities')
    .select('id, status, compensation_min, compensation_max, effective_hourly_rate, economics_basis')
    .eq('id', data.opportunity_id)
    .maybeSingle()

  if (error || !opportunity) {
    redirectWithError(
      data.opportunity_id,
      error?.message ?? 'Opportunity not found.'
    )
  }

  if (opportunity.status !== 'negotiating') {
    redirectWithError(
      data.opportunity_id,
      'Negotiation decisions can only be recorded while the opportunity is negotiating.'
    )
  }

  const labels = {
    accept: 'Accept',
    counter: 'Counter',
    pass: 'Pass',
    needs_info: 'Needs Info',
  } as const

  const snapshot = [
    `Decision: ${labels[data.decision]}`,
    `Current guaranteed offer: ${fmtMoney(opportunity.compensation_min)}`,
    `Current maximum offer: ${fmtMoney(opportunity.compensation_max)}`,
    `Current effective rate: ${opportunity.effective_hourly_rate == null ? '—' : `${fmtMoney(opportunity.effective_hourly_rate)}/hr`}`,
    data.proposed_fee == null ? null : `Proposed fee: ${fmtMoney(data.proposed_fee)}`,
    data.note ? `\n${data.note}` : null,
  ].filter(Boolean).join('\n')

  const saved = await logManagerOpportunityActivity(admin, {
    opportunityId: data.opportunity_id,
    activityType: 'negotiation',
    title: `Negotiation decision — ${labels[data.decision]}`,
    body: snapshot,
    metadata: {
      decision: data.decision,
      proposed_fee: data.proposed_fee ?? null,
      offer_snapshot: {
        compensation_min: opportunity.compensation_min,
        compensation_max: opportunity.compensation_max,
        effective_hourly_rate: opportunity.effective_hourly_rate,
        economics_basis: opportunity.economics_basis,
      },
    },
  })

  if (!saved) {
    redirectWithError(data.opportunity_id, 'Negotiation decision could not be saved.')
  }

  const update =
    data.decision === 'pass'
      ? {
          status: 'passed',
          next_action: null,
          next_action_at: null,
        }
      : data.decision === 'accept'
        ? {
            status: 'negotiating',
            next_action: 'Confirm final terms, then create the booking.',
            next_action_at: null,
          }
        : data.decision === 'counter'
          ? {
              status: 'negotiating',
              next_action: 'Send the counter using the agreed channel, then log the response.',
              next_action_at: null,
            }
          : {
              status: 'negotiating',
              next_action: 'Get the missing terms before making a negotiation decision.',
              next_action_at: null,
            }

  const { error: updateError } = await admin
    .from('manager_opportunities')
    .update(update)
    .eq('id', data.opportunity_id)

  if (updateError) {
    redirectWithError(data.opportunity_id, updateError.message)
  }

  if (data.decision === 'pass') {
    await logManagerOpportunityActivity(admin, {
      opportunityId: data.opportunity_id,
      activityType: 'status_change',
      title: 'Pipeline status changed',
      body: 'negotiating → passed',
      fromStatus: 'negotiating',
      toStatus: 'passed',
      metadata: { reason: 'negotiation_pass' },
    })
  }

  revalidatePath('/admin/manager')
  revalidatePath(`/admin/manager/opportunities/${data.opportunity_id}`)
  redirect(
    `/admin/manager/opportunities/${data.opportunity_id}?success=${encodeURIComponent('Negotiation decision recorded.')}`
  )
}
