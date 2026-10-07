'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import {
  MANAGER_WATCH_PLATFORMS,
  MANAGER_WATCH_SOURCE_KINDS,
} from '@/lib/manager'
import { createAdminClient } from '@/lib/supabase/admin'
import { scoreManagerOpportunity } from '@/lib/manager-scoring'
import { logManagerOpportunityActivity } from '@/lib/manager-activity'
import { managerSignalCanBecomeOpportunity } from '@/lib/manager-source-health'

const SourceSchema = z.object({
  name: z.string().trim().min(1, 'Source name is required.').max(200),
  source_kind: z.enum(MANAGER_WATCH_SOURCE_KINDS),
  platform: z.enum(MANAGER_WATCH_PLATFORMS),
  url: z.string().trim().url('Enter a valid URL.').max(1000),
  handle: z.string().trim().max(200).optional().default(''),
  location_city: z.string().trim().max(160).optional().default(''),
  location_state: z.string().trim().max(80).optional().default(''),
  recommended_demo: z.string().trim().max(300).optional().default(''),
  recommended_demo_reason: z.string().trim().max(3000).optional().default(''),
  notes: z.string().trim().max(5000).optional().default(''),
})

function optionalString(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function redirectWithError(message: string): never {
  redirect(`/admin/manager/sources?error=${encodeURIComponent(message)}`)
}

export async function createManagerSourceAction(formData: FormData) {
  await requireAdminUser()

  const parsed = SourceSchema.safeParse({
    name: formData.get('name'),
    source_kind: formData.get('source_kind'),
    platform: formData.get('platform'),
    url: formData.get('url'),
    handle: formData.get('handle'),
    location_city: formData.get('location_city'),
    location_state: formData.get('location_state'),
    recommended_demo: formData.get('recommended_demo'),
    recommended_demo_reason: formData.get('recommended_demo_reason'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? 'Invalid source.')
  }

  const data = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from('manager_sources')
    .insert({
      name: data.name,
      source_kind: data.source_kind,
      platform: data.platform,
      url: data.url,
      handle: optionalString(data.handle),
      location_city: optionalString(data.location_city),
      location_state: optionalString(data.location_state),
      recommended_demo: optionalString(data.recommended_demo),
      recommended_demo_reason: optionalString(data.recommended_demo_reason),
      notes: optionalString(data.notes),
      check_reliability: data.platform === 'website' ? 'partial' : 'partial',
    })

  if (error) {
    redirectWithError(error.code === '23505' ? 'That source URL is already on the watchlist.' : error.message)
  }

  revalidatePath('/admin/manager')
  revalidatePath('/admin/manager/sources')
  redirect(`/admin/manager/sources?success=${encodeURIComponent('Source added.')}`)
}

export async function toggleManagerSourceAction(formData: FormData) {
  await requireAdminUser()

  const id = z.string().uuid().safeParse(formData.get('id'))
  const active = String(formData.get('active')) === 'true'
  if (!id.success) redirectWithError('Invalid source ID.')

  const admin = createAdminClient()
  const { error } = await admin
    .from('manager_sources')
    .update({ active })
    .eq('id', id.data)

  if (error) redirectWithError(error.message)

  revalidatePath('/admin/manager/sources')
}

export async function setManagerSignalStatusAction(formData: FormData) {
  await requireAdminUser()

  const id = z.string().uuid().safeParse(formData.get('id'))
  const status = z.enum(['new', 'relevant', 'ignored']).safeParse(formData.get('status'))
  if (!id.success || !status.success) redirectWithError('Invalid signal update.')

  const admin = createAdminClient()
  const { error } = await admin
    .from('manager_source_signals')
    .update({ status: status.data })
    .eq('id', id.data)
    .is('linked_opportunity_id', null)

  if (error) redirectWithError(error.message)

  revalidatePath('/admin/manager/sources')
}

export async function convertManagerSignalToOpportunityAction(formData: FormData) {
  await requireAdminUser()

  const id = z.string().uuid().safeParse(formData.get('id'))
  if (!id.success) redirectWithError('Invalid signal ID.')

  const admin = createAdminClient()
  const { data: signal, error } = await admin
    .from('manager_source_signals')
    .select(`
      id, title, url, summary, signal_type, source_payload, linked_opportunity_id,
      manager_sources!inner(
        id, name, source_kind, platform, url, recommended_demo, recommended_demo_reason
      )
    `)
    .eq('id', id.data)
    .maybeSingle()

  if (error || !signal) redirectWithError(error?.message ?? 'Signal not found.')
  if (signal.linked_opportunity_id) {
    redirect(`/admin/manager/opportunities/${signal.linked_opportunity_id}`)
  }

  const source = Array.isArray(signal.manager_sources)
    ? signal.manager_sources[0]
    : signal.manager_sources

  if (!source) redirectWithError('Signal source is missing.')

  if (!managerSignalCanBecomeOpportunity({
    signal_type: signal.signal_type,
    source_payload: signal.source_payload as Record<string, unknown> | null,
    source_kind: source.source_kind,
  })) {
    redirectWithError('This is relationship/watch evidence, not an actionable opportunity. Keep it in Sources / Relationships.')
  }

  const sourceType =
    source.platform === 'instagram' ? 'instagram' :
    source.platform === 'x' ? 'x' :
    source.platform === 'linkedin' ? 'linkedin' :
    source.platform === 'website' ? 'website' :
    'manual'

  const payload = {
    opportunity_type: 'dj_gig',
    source_type: sourceType,
    status: 'review',
    title: signal.title,
    organization: source.name,
    source_url: signal.url || source.url,
    source_reference: `Watchlist signal: ${signal.signal_type}`,
    why_fit: signal.summary,
    recommended_demo: source.recommended_demo,
    recommended_demo_reason: source.recommended_demo_reason,
    next_action: 'Review this watchlist signal and decide whether to contact/apply.',
  }

  const { data: profile } = await admin
    .from('manager_profiles')
    .select('home_market, minimum_fee, target_hourly_rate, max_drive_minutes, preferred_event_types, excluded_event_types, genres')
    .eq('profile_key', 'dj_bae')
    .maybeSingle()

  const score = profile ? scoreManagerOpportunity(profile, payload) : null

  const { data: opportunity, error: opportunityError } = await admin
    .from('manager_opportunities')
    .insert({
      ...payload,
      ...(score ? {
        fit_score: score.score,
        fit_score_breakdown: score.breakdown,
        fit_score_version: score.version,
        fit_scored_at: new Date().toISOString(),
      } : {}),
    })
    .select('id')
    .single()

  if (opportunityError || !opportunity?.id) {
    redirectWithError(opportunityError?.message ?? 'Could not create opportunity.')
  }

  await logManagerOpportunityActivity(admin, {
    opportunityId: opportunity.id,
    activityType: 'created',
    title: 'Opportunity created from Watchlist',
    body: signal.summary ?? `Converted from ${source.name} watchlist signal.`,
    metadata: {
      source_id: source.id,
      signal_id: signal.id,
      signal_type: signal.signal_type,
    },
  })

  const { error: signalError } = await admin
    .from('manager_source_signals')
    .update({
      status: 'converted',
      linked_opportunity_id: opportunity.id,
    })
    .eq('id', id.data)

  if (signalError) {
    redirectWithError(`Opportunity created, but signal link failed: ${signalError.message}`)
  }

  revalidatePath('/admin/manager')
  revalidatePath('/admin/manager/sources')
  redirect(`/admin/manager/opportunities/${opportunity.id}?success=${encodeURIComponent('Created from watchlist signal.')}`)
}
