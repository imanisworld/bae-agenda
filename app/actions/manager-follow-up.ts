'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import { logManagerOpportunityActivity } from '@/lib/manager-activity'
import {
  defaultManagerSecondFollowUpDate,
  managerFollowUpActionLabel,
  managerFollowUpSubject,
} from '@/lib/manager-follow-up'
import { renderManagerOutreachHtml } from '@/lib/manager-dispatch'
import {
  MANAGER_OUTREACH_CHANNELS,
  MANAGER_OUTREACH_CHANNEL_LABELS,
  type ManagerOutreachChannel,
} from '@/lib/manager-outreach'
import { sendEmailNotification } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'

const FollowUpSchema = z.object({
  opportunity_id: z.string().uuid(),
  follow_up_draft: z.string().trim().min(1, 'Follow-up draft cannot be empty.').max(12000),
  next_follow_up_on: z
    .string()
    .trim()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Use a valid next follow-up date.')
    .transform((value) => value || null),
  confirm_follow_up: z.literal('yes'),
})

function redirectWithError(id: string, message: string): never {
  redirect(
    `/admin/manager/opportunities/${id}?error=${encodeURIComponent(message)}`
  )
}

export async function dispatchManagerFollowUpAction(formData: FormData) {
  await requireAdminUser()

  const rawId = String(formData.get('opportunity_id') ?? '')
  const parsed = FollowUpSchema.safeParse({
    opportunity_id: formData.get('opportunity_id'),
    follow_up_draft: formData.get('follow_up_draft'),
    next_follow_up_on: formData.get('next_follow_up_on'),
    confirm_follow_up: formData.get('confirm_follow_up'),
  })

  if (!parsed.success) {
    redirectWithError(
      rawId,
      parsed.error.issues[0]?.message ?? 'Confirm the follow-up before continuing.'
    )
  }

  const id = parsed.data.opportunity_id
  const admin = createAdminClient()

  const { data: opportunity, error } = await admin
    .from('manager_opportunities')
    .select(`
      id, title, organization, status,
      contact_email,
      outreach_channel, outreach_subject,
      next_action_at, last_contacted_at, applied_at
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !opportunity) {
    redirectWithError(id, error?.message ?? 'Opportunity not found.')
  }

  if (!['applied', 'contacted', 'follow_up'].includes(opportunity.status)) {
    redirectWithError(id, 'This opportunity is not currently in the follow-up workflow.')
  }

  const rawChannel = opportunity.outreach_channel as string | null
  if (
    !rawChannel ||
    !MANAGER_OUTREACH_CHANNELS.includes(rawChannel as ManagerOutreachChannel)
  ) {
    redirectWithError(id, 'A verified outreach channel is required before following up.')
  }

  const channel = rawChannel as ManagerOutreachChannel
  const now = new Date().toISOString()
  const nextFollowUpOn =
    parsed.data.next_follow_up_on ?? defaultManagerSecondFollowUpDate(new Date())

  if (channel === 'email') {
    const recipient = opportunity.contact_email?.trim()
    const subject = managerFollowUpSubject(opportunity)

    if (!recipient) {
      redirectWithError(id, 'A verified contact email is required before sending a follow-up email.')
    }
    if (!subject) {
      redirectWithError(id, 'An email subject is required before sending a follow-up.')
    }

    const result = await sendEmailNotification({
      to: recipient,
      subject,
      text: parsed.data.follow_up_draft,
      html: renderManagerOutreachHtml(parsed.data.follow_up_draft),
      idempotencyKey: `manager-followup-${id}-${opportunity.next_action_at ?? opportunity.last_contacted_at ?? opportunity.applied_at ?? 'scheduled'}`,
    })

    if (!result.ok) {
      redirectWithError(
        id,
        result.detail || 'The follow-up email could not be sent. No pipeline status was changed.'
      )
    }
  }

  const { data: updated, error: updateError } = await admin
    .from('manager_opportunities')
    .update({
      status: 'follow_up',
      last_contacted_at: now,
      next_action: 'Follow up again if there is still no response.',
      next_action_at: nextFollowUpOn,
    })
    .eq('id', id)
    .in('status', ['applied', 'contacted', 'follow_up'])
    .select('id')
    .maybeSingle()

  if (updateError || !updated) {
    const note =
      channel === 'email'
        ? 'Follow-up email delivery succeeded, but Manager could not update the pipeline. Review this opportunity before sending again.'
        : 'The follow-up was recorded by you, but Manager could not update the pipeline. Review the opportunity before recording it again.'
    redirectWithError(id, updateError?.message ? `${note} ${updateError.message}` : note)
  }

  await logManagerOpportunityActivity(admin, {
    opportunityId: id,
    activityType: 'follow_up',
    title: channel === 'email' ? 'Follow-up email sent' : managerFollowUpActionLabel(channel).replace(/^Mark /, '').replace(/ Sent$/, ' sent'),
    body: parsed.data.follow_up_draft,
    occurredAt: now,
    metadata: {
      channel,
      channel_label: MANAGER_OUTREACH_CHANNEL_LABELS[channel],
      recipient: channel === 'email' ? opportunity.contact_email : opportunity.organization || opportunity.title,
      subject: managerFollowUpSubject(opportunity),
      next_follow_up_on: nextFollowUpOn,
      delivery: channel === 'email' ? 'sent_by_manager_via_resend' : 'recorded_external_action',
    },
  })

  if (opportunity.status !== 'follow_up') {
    await logManagerOpportunityActivity(admin, {
      opportunityId: id,
      activityType: 'status_change',
      title: 'Pipeline status changed',
      body: `${opportunity.status} → follow_up`,
      occurredAt: now,
      fromStatus: opportunity.status,
      toStatus: 'follow_up',
      metadata: {
        reason: 'follow_up_dispatched',
        channel,
      },
    })
  }

  revalidatePath('/admin/manager')
  revalidatePath(`/admin/manager/opportunities/${id}`)
  redirect(
    `/admin/manager/opportunities/${id}?success=${encodeURIComponent(
      `Follow-up recorded. Next check scheduled for ${nextFollowUpOn}.`
    )}`
  )
}
