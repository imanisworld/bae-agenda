'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import { logManagerOpportunityActivity } from '@/lib/manager-activity'
import {
  MANAGER_OUTREACH_VERSION,
  prepareManagerOutreach,
  type ManagerOutreachChannel,
} from '@/lib/manager-outreach'
import { createAdminClient } from '@/lib/supabase/admin'

const OpportunityIdSchema = z.string().uuid()

const DraftSchema = z.object({
  opportunity_id: z.string().uuid(),
  outreach_channel: z.enum([
    'email',
    'instagram_dm',
    'application',
    'web_form',
    'phone',
    'other',
  ]),
  outreach_subject: z.string().trim().max(300).optional().default(''),
  outreach_draft: z.string().trim().min(1, 'Outreach draft cannot be empty.').max(12000),
})

function redirectWithError(id: string, message: string): never {
  redirect(
    `/admin/manager/opportunities/${id}?error=${encodeURIComponent(message)}`
  )
}

export async function prepareManagerOutreachAction(formData: FormData) {
  await requireAdminUser()

  const parsedId = OpportunityIdSchema.safeParse(formData.get('opportunity_id'))
  const rawId = String(formData.get('opportunity_id') ?? '')
  if (!parsedId.success) redirectWithError(rawId, 'Invalid opportunity ID.')

  const id = parsedId.data
  const admin = createAdminClient()

  const [
    { data: opportunity, error: opportunityError },
    { data: profile, error: profileError },
    { data: mixes, error: mixesError },
  ] = await Promise.all([
    admin
      .from('manager_opportunities')
      .select('id, title, organization, source_type, source_url, source_reference, contact_name, contact_email, contact_phone, application_deadline, requirements, why_fit, recommended_demo, status')
      .eq('id', id)
      .maybeSingle(),
    admin
      .from('manager_profiles')
      .select('display_name, home_market, website_url, instagram_url, press_kit_url, genres')
      .eq('profile_key', 'dj_bae')
      .maybeSingle(),
    admin
      .from('mixes')
      .select('id, title, description, genre, embed_url, is_featured, sort_order')
      .not('published_at', 'is', null)
      .not('embed_url', 'is', null)
      .order('sort_order', { ascending: true }),
  ])

  if (opportunityError || !opportunity) {
    redirectWithError(id, opportunityError?.message ?? 'Opportunity not found.')
  }
  if (profileError || !profile) {
    redirectWithError(id, profileError?.message ?? 'Manager profile is missing.')
  }
  if (mixesError) {
    redirectWithError(id, mixesError.message)
  }

  const prep = prepareManagerOutreach(profile, opportunity, mixes ?? [])
  const canAdvance =
    prep.ready &&
    ['found', 'qualified', 'review'].includes(opportunity.status)

  const nextStatus = canAdvance ? 'outreach_ready' : opportunity.status
  const preparedAt = new Date().toISOString()

  const { error: updateError } = await admin
    .from('manager_opportunities')
    .update({
      outreach_channel: prep.channel,
      outreach_subject: prep.subject,
      outreach_draft: prep.draft,
      outreach_assets: prep.assets,
      outreach_missing_items: prep.missingItems,
      outreach_prepared_at: preparedAt,
      outreach_version: MANAGER_OUTREACH_VERSION,
      status: nextStatus,
      next_action: prep.ready
        ? 'Review outreach draft and send/apply when ready.'
        : 'Resolve outreach-prep missing items before sending.',
    })
    .eq('id', id)

  if (updateError) redirectWithError(id, updateError.message)

  const prepSummary = [
    `Channel: ${prep.channel}`,
    `Assets: ${prep.assets.map((asset) => asset.label).join(', ') || 'none'}`,
    prep.missingItems.length
      ? `Missing: ${prep.missingItems.join('; ')}`
      : 'Missing: none',
  ].join('\n')

  await logManagerOpportunityActivity(admin, {
    opportunityId: id,
    activityType: 'research',
    title: 'Outreach prep generated',
    body: prepSummary,
    occurredAt: preparedAt,
    metadata: {
      outreach_version: prep.version,
      outreach_channel: prep.channel,
      ready: prep.ready,
    },
  })

  if (nextStatus !== opportunity.status) {
    await logManagerOpportunityActivity(admin, {
      opportunityId: id,
      activityType: 'status_change',
      title: 'Pipeline status changed',
      body: `${opportunity.status} → ${nextStatus}`,
      occurredAt: preparedAt,
      fromStatus: opportunity.status,
      toStatus: nextStatus,
      metadata: { reason: 'outreach_prep_ready' },
    })
  }

  revalidatePath('/admin/manager')
  revalidatePath(`/admin/manager/opportunities/${id}`)
  redirect(
    `/admin/manager/opportunities/${id}?success=${encodeURIComponent(
      prep.ready
        ? 'Outreach prep generated and marked outreach-ready.'
        : 'Outreach prep generated. Review the missing items before sending.'
    )}`
  )
}

export async function saveManagerOutreachDraftAction(formData: FormData) {
  await requireAdminUser()

  const parsed = DraftSchema.safeParse({
    opportunity_id: formData.get('opportunity_id'),
    outreach_channel: formData.get('outreach_channel'),
    outreach_subject: formData.get('outreach_subject'),
    outreach_draft: formData.get('outreach_draft'),
  })

  const rawId = String(formData.get('opportunity_id') ?? '')
  if (!parsed.success) {
    redirectWithError(
      rawId,
      parsed.error.issues[0]?.message ?? 'Invalid outreach draft.'
    )
  }

  const data = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from('manager_opportunities')
    .update({
      outreach_channel: data.outreach_channel as ManagerOutreachChannel,
      outreach_subject: data.outreach_subject || null,
      outreach_draft: data.outreach_draft,
    })
    .eq('id', data.opportunity_id)

  if (error) redirectWithError(data.opportunity_id, error.message)

  await logManagerOpportunityActivity(admin, {
    opportunityId: data.opportunity_id,
    activityType: 'note',
    title: 'Outreach draft edited',
    body: 'Prepared outreach copy was reviewed and saved. Nothing was sent automatically.',
  })

  revalidatePath(`/admin/manager/opportunities/${data.opportunity_id}`)
  redirect(
    `/admin/manager/opportunities/${data.opportunity_id}?success=${encodeURIComponent('Outreach draft saved. Nothing was sent.')}`
  )
}
