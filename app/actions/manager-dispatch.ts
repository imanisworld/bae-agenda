'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import { logManagerOpportunityActivity } from '@/lib/manager-activity'
import {
  defaultManagerFollowUpDate,
  managerDispatchActivityType,
  managerDispatchStatus,
  managerDispatchSuccessLabel,
  renderManagerOutreachHtml,
} from '@/lib/manager-dispatch'
import {
  MANAGER_OUTREACH_CHANNELS,
  MANAGER_OUTREACH_CHANNEL_LABELS,
  type ManagerOutreachAsset,
} from '@/lib/manager-outreach'
import { sendEmailNotification } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'

const DispatchSchema = z.object({
  opportunity_id: z.string().uuid(),
  follow_up_on: z
    .string()
    .trim()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Use a valid follow-up date.')
    .transform((value) => value || null),
  confirm_dispatch: z.literal('yes'),
})

function redirectWithError(id: string, message: string): never {
  redirect(
    `/admin/manager/opportunities/${id}?error=${encodeURIComponent(message)}`
  )
}

export async function dispatchManagerOutreachAction(formData: FormData) {
  await requireAdminUser()

  const rawId = String(formData.get('opportunity_id') ?? '')
  const parsed = DispatchSchema.safeParse({
    opportunity_id: formData.get('opportunity_id'),
    follow_up_on: formData.get('follow_up_on'),
    confirm_dispatch: formData.get('confirm_dispatch'),
  })

  if (!parsed.success) {
    redirectWithError(
      rawId,
      parsed.error.issues[0]?.message ?? 'Confirm the outreach action before continuing.'
    )
  }

  const id = parsed.data.opportunity_id
  const admin = createAdminClient()

  const { data: opportunity, error } = await admin
    .from('manager_opportunities')
    .select(`
      id, title, organization, status,
      contact_email,
      outreach_channel, outreach_subject, outreach_draft,
      outreach_assets, outreach_missing_items, outreach_prepared_at, outreach_version,
      applied_at, last_contacted_at
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !opportunity) {
    redirectWithError(id, error?.message ?? 'Opportunity not found.')
  }

  if (opportunity.status !== 'outreach_ready') {
    redirectWithError(id, 'This opportunity is not currently marked outreach-ready.')
  }

  if (!opportunity.outreach_channel || !MANAGER_OUTREACH_CHANNELS.includes(opportunity.outreach_channel)) {
    redirectWithError(id, 'Prepare outreach before sending or recording it.')
  }

  const channel = opportunity.outreach_channel
  const draft = opportunity.outreach_draft?.trim()
  const missing = Array.isArray(opportunity.outreach_missing_items)
    ? opportunity.outreach_missing_items
    : []

  if (!draft) {
    redirectWithError(id, 'Prepared outreach copy is missing.')
  }

  if (missing.length > 0) {
    redirectWithError(id, 'Resolve the outreach-prep missing items before dispatch.')
  }

  const now = new Date().toISOString()
  const followUpOn = parsed.data.follow_up_on ?? defaultManagerFollowUpDate(new Date())
  const assets = Array.isArray(opportunity.outreach_assets)
    ? opportunity.outreach_assets as ManagerOutreachAsset[]
    : []

  if (channel === 'email') {
    const recipient = opportunity.contact_email?.trim()
    const subject = opportunity.outreach_subject?.trim()

    if (!recipient) {
      redirectWithError(id, 'A verified contact email is required before Manager can send email.')
    }
    if (!subject) {
      redirectWithError(id, 'An email subject is required before sending.')
    }

    const sendResult = await sendEmailNotification({
      to: recipient,
      subject,
      text: draft,
      html: renderManagerOutreachHtml(draft),
      idempotencyKey: `manager-outreach-${id}-${opportunity.outreach_prepared_at ?? 'prepared'}`,
    })

    if (!sendResult.ok) {
      redirectWithError(
        id,
        sendResult.detail || 'The email could not be sent. No pipeline status was changed.'
      )
    }
  }

  const nextStatus = managerDispatchStatus(channel)
  const lifecycleUpdate: Record<string, unknown> = {
    status: nextStatus,
    next_action: 'Follow up on outreach.',
    next_action_at: followUpOn,
  }

  if (nextStatus === 'applied') {
    lifecycleUpdate.applied_at = opportunity.applied_at ?? now
  } else {
    lifecycleUpdate.last_contacted_at = now
  }

  const { data: updated, error: updateError } = await admin
    .from('manager_opportunities')
    .update(lifecycleUpdate)
    .eq('id', id)
    .eq('status', 'outreach_ready')
    .select('id')
    .maybeSingle()

  if (updateError || !updated) {
    const note =
      channel === 'email'
        ? 'Email delivery succeeded, but Manager could not update the pipeline. Review this opportunity before sending anything again.'
        : 'The external outreach was recorded by you, but Manager could not update the pipeline. Review the opportunity before recording it again.'
    redirectWithError(id, updateError?.message ? `${note} ${updateError.message}` : note)
  }

  const channelLabel = MANAGER_OUTREACH_CHANNEL_LABELS[channel]
  const recipient =
    channel === 'email'
      ? opportunity.contact_email
      : opportunity.organization || opportunity.title

  await logManagerOpportunityActivity(admin, {
    opportunityId: id,
    activityType: managerDispatchActivityType(channel),
    title: managerDispatchSuccessLabel(channel),
    body: draft,
    occurredAt: now,
    metadata: {
      channel,
      channel_label: channelLabel,
      recipient,
      subject: opportunity.outreach_subject,
      assets,
      follow_up_on: followUpOn,
      outreach_version: opportunity.outreach_version,
      delivery: channel === 'email' ? 'sent_by_manager_via_resend' : 'recorded_external_action',
    },
  })

  await logManagerOpportunityActivity(admin, {
    opportunityId: id,
    activityType: 'status_change',
    title: 'Pipeline status changed',
    body: `outreach_ready → ${nextStatus}`,
    occurredAt: now,
    fromStatus: 'outreach_ready',
    toStatus: nextStatus,
    metadata: {
      reason: 'outreach_dispatched',
      channel,
    },
  })

  revalidatePath('/admin/manager')
  revalidatePath(`/admin/manager/opportunities/${id}`)
  redirect(
    `/admin/manager/opportunities/${id}?success=${encodeURIComponent(
      `${managerDispatchSuccessLabel(channel)}. Follow-up scheduled for ${followUpOn}.`
    )}`
  )
}
