'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import {
  MANAGER_OPPORTUNITY_STATUSES,
  MANAGER_OPPORTUNITY_TYPES,
  MANAGER_SOURCE_TYPES,
  splitManagerList,
} from '@/lib/manager'
import { createAdminClient } from '@/lib/supabase/admin'

const OptionalDate = z
  .string()
  .trim()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Use a valid date.')
  .transform((value) => value || null)

const OptionalMoney = z
  .string()
  .trim()
  .refine((value) => !value || /^\d+(?:\.\d{1,2})?$/.test(value), 'Enter a valid amount.')
  .transform((value) => (value ? Number(value) : null))
  .refine((value) => value === null || value >= 0, 'Amounts cannot be negative.')

const OptionalInteger = z
  .string()
  .trim()
  .refine((value) => !value || /^\d+$/.test(value), 'Enter a whole number.')
  .transform((value) => (value ? Number(value) : null))

const OptionalNumber = z
  .string()
  .trim()
  .refine((value) => !value || /^\d+(?:\.\d+)?$/.test(value), 'Enter a valid number.')
  .transform((value) => (value ? Number(value) : null))
  .refine((value) => value === null || value >= 0, 'Values cannot be negative.')

const OptionalUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true
    try {
      const url = new URL(value)
      return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
      return false
    }
  }, 'Enter a valid http(s) URL.')
  .transform((value) => value || null)

const OptionalEmail = z
  .string()
  .trim()
  .email('Enter a valid email address.')
  .or(z.literal(''))
  .transform((value) => value || null)

const OpportunitySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Opportunity title is required.').max(200),
  organization: z.string().trim().max(200).optional().default(''),
  venue_name: z.string().trim().max(200).optional().default(''),
  opportunity_type: z.enum(MANAGER_OPPORTUNITY_TYPES),
  source_type: z.enum(MANAGER_SOURCE_TYPES),
  status: z.enum(MANAGER_OPPORTUNITY_STATUSES),
  source_url: OptionalUrl,
  source_reference: z.string().trim().max(500).optional().default(''),
  contact_name: z.string().trim().max(200).optional().default(''),
  contact_email: OptionalEmail,
  contact_phone: z.string().trim().max(80).optional().default(''),
  location_address: z.string().trim().max(300).optional().default(''),
  location_city: z.string().trim().max(160).optional().default(''),
  location_state: z.string().trim().max(80).optional().default(''),
  location_country: z.string().trim().max(80).optional().default('US'),
  event_date: OptionalDate,
  application_deadline: OptionalDate,
  compensation_min: OptionalMoney,
  compensation_max: OptionalMoney,
  compensation_notes: z.string().trim().max(2000).optional().default(''),
  travel_minutes: OptionalInteger,
  travel_miles: OptionalNumber,
  travel_cost_estimate: OptionalMoney,
  travel_covered: z.boolean(),
  lodging_provided: z.boolean(),
  equipment_notes: z.string().trim().max(3000).optional().default(''),
  requirements: z.string().trim().max(8000).optional().default(''),
  why_fit: z.string().trim().max(5000).optional().default(''),
  risk_notes: z.string().trim().max(5000).optional().default(''),
  internal_notes: z.string().trim().max(8000).optional().default(''),
  fit_score: OptionalInteger.refine(
    (value) => value === null || value <= 100,
    'Fit score must be between 0 and 100.'
  ),
  next_action: z.string().trim().max(1000).optional().default(''),
  next_action_at: OptionalDate,
}).superRefine((value, ctx) => {
  if (
    value.compensation_min !== null &&
    value.compensation_max !== null &&
    value.compensation_max < value.compensation_min
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['compensation_max'],
      message: 'Maximum compensation cannot be lower than minimum compensation.',
    })
  }
})

const ManagerProfileSchema = z.object({
  display_name: z.string().trim().min(1, 'Display name is required.').max(160),
  home_market: z.string().trim().max(200).optional().default(''),
  minimum_fee: OptionalMoney,
  target_hourly_rate: OptionalMoney,
  max_drive_minutes: OptionalInteger,
  max_one_way_miles: OptionalNumber,
  minimum_notice_days: OptionalInteger,
  preferred_event_types: z.string().max(3000).optional().default(''),
  excluded_event_types: z.string().max(3000).optional().default(''),
  target_markets: z.string().max(3000).optional().default(''),
  target_brands: z.string().max(5000).optional().default(''),
  genres: z.string().max(3000).optional().default(''),
  equipment_notes: z.string().trim().max(5000).optional().default(''),
  travel_notes: z.string().trim().max(5000).optional().default(''),
  deal_breakers: z.string().trim().max(5000).optional().default(''),
  website_url: OptionalUrl,
  instagram_url: OptionalUrl,
  press_kit_url: OptionalUrl,
  notes: z.string().trim().max(8000).optional().default(''),
})

function optionalString(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function redirectWithError(path: string, message: string): never {
  const separator = path.includes('?') ? '&' : '?'
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`)
}

function managerDbError(error: { code?: string; message?: string } | null | undefined) {
  if (error?.code === '42P01' || error?.code === 'PGRST205') {
    return 'Manager database tables are not installed in this environment yet.'
  }

  return error?.message || 'The manager record could not be saved.'
}

function opportunityInput(formData: FormData) {
  return {
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    organization: formData.get('organization'),
    venue_name: formData.get('venue_name'),
    opportunity_type: formData.get('opportunity_type'),
    source_type: formData.get('source_type'),
    status: formData.get('status') ?? 'found',
    source_url: formData.get('source_url'),
    source_reference: formData.get('source_reference'),
    contact_name: formData.get('contact_name'),
    contact_email: formData.get('contact_email'),
    contact_phone: formData.get('contact_phone'),
    location_address: formData.get('location_address'),
    location_city: formData.get('location_city'),
    location_state: formData.get('location_state'),
    location_country: formData.get('location_country') ?? 'US',
    event_date: formData.get('event_date'),
    application_deadline: formData.get('application_deadline'),
    compensation_min: formData.get('compensation_min'),
    compensation_max: formData.get('compensation_max'),
    compensation_notes: formData.get('compensation_notes'),
    travel_minutes: formData.get('travel_minutes'),
    travel_miles: formData.get('travel_miles'),
    travel_cost_estimate: formData.get('travel_cost_estimate'),
    travel_covered: formData.get('travel_covered') === 'on',
    lodging_provided: formData.get('lodging_provided') === 'on',
    equipment_notes: formData.get('equipment_notes'),
    requirements: formData.get('requirements'),
    why_fit: formData.get('why_fit'),
    risk_notes: formData.get('risk_notes'),
    internal_notes: formData.get('internal_notes'),
    fit_score: formData.get('fit_score'),
    next_action: formData.get('next_action'),
    next_action_at: formData.get('next_action_at'),
  }
}

function opportunityPayload(data: z.infer<typeof OpportunitySchema>) {
  return {
    title: data.title,
    organization: optionalString(data.organization),
    venue_name: optionalString(data.venue_name),
    opportunity_type: data.opportunity_type,
    source_type: data.source_type,
    status: data.status,
    source_url: data.source_url,
    source_reference: optionalString(data.source_reference),
    contact_name: optionalString(data.contact_name),
    contact_email: data.contact_email,
    contact_phone: optionalString(data.contact_phone),
    location_address: optionalString(data.location_address),
    location_city: optionalString(data.location_city),
    location_state: optionalString(data.location_state),
    location_country: optionalString(data.location_country) ?? 'US',
    event_date: data.event_date,
    application_deadline: data.application_deadline,
    compensation_min: data.compensation_min,
    compensation_max: data.compensation_max,
    compensation_notes: optionalString(data.compensation_notes),
    travel_minutes: data.travel_minutes,
    travel_miles: data.travel_miles,
    travel_cost_estimate: data.travel_cost_estimate,
    travel_covered: data.travel_covered,
    lodging_provided: data.lodging_provided,
    equipment_notes: optionalString(data.equipment_notes),
    requirements: optionalString(data.requirements),
    why_fit: optionalString(data.why_fit),
    risk_notes: optionalString(data.risk_notes),
    internal_notes: optionalString(data.internal_notes),
    fit_score: data.fit_score,
    next_action: optionalString(data.next_action),
    next_action_at: data.next_action_at,
  }
}

export async function createManagerOpportunityAction(formData: FormData) {
  await requireAdminUser()

  const parsed = OpportunitySchema.safeParse(opportunityInput(formData))
  if (!parsed.success) {
    redirectWithError(
      '/admin/manager/opportunities/new',
      parsed.error.issues[0]?.message ?? 'Invalid opportunity details.'
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('manager_opportunities')
    .insert(opportunityPayload(parsed.data))
    .select('id')
    .single()

  if (error || !data?.id) {
    redirectWithError('/admin/manager/opportunities/new', managerDbError(error))
  }

  revalidatePath('/admin/manager')
  redirect(`/admin/manager/opportunities/${data.id}?success=${encodeURIComponent('Opportunity added.')}`)
}

export async function updateManagerOpportunityAction(formData: FormData) {
  await requireAdminUser()

  const parsed = OpportunitySchema.safeParse(opportunityInput(formData))
  if (!parsed.success || !parsed.data.id) {
    const id = String(formData.get('id') ?? '')
    redirectWithError(
      id ? `/admin/manager/opportunities/${id}` : '/admin/manager',
      parsed.success ? 'Missing opportunity ID.' : parsed.error.issues[0]?.message ?? 'Invalid opportunity details.'
    )
  }

  const id = parsed.data.id
  const payload: Record<string, unknown> = opportunityPayload(parsed.data)
  const admin = createAdminClient()

  const { data: current, error: currentError } = await admin
    .from('manager_opportunities')
    .select('status, applied_at, last_contacted_at, booked_at')
    .eq('id', id)
    .maybeSingle()

  if (currentError || !current) {
    redirectWithError(
      `/admin/manager/opportunities/${id}`,
      managerDbError(currentError) || 'Unable to load the current opportunity before saving.'
    )
  }

  const now = new Date().toISOString()
  const statusChanged = current.status !== parsed.data.status

  if (parsed.data.status === 'applied' && statusChanged && !current.applied_at) {
    payload.applied_at = now
  }
  if (parsed.data.status === 'contacted' && statusChanged && !current.last_contacted_at) {
    payload.last_contacted_at = now
  }
  if (parsed.data.status === 'booked' && statusChanged && !current.booked_at) {
    payload.booked_at = now
  }

  const { error } = await admin
    .from('manager_opportunities')
    .update(payload)
    .eq('id', id)

  if (error) {
    redirectWithError(`/admin/manager/opportunities/${id}`, managerDbError(error))
  }

  revalidatePath('/admin/manager')
  revalidatePath(`/admin/manager/opportunities/${id}`)
  redirect(`/admin/manager/opportunities/${id}?success=${encodeURIComponent('Opportunity saved.')}`)
}

export async function updateManagerProfileAction(formData: FormData) {
  await requireAdminUser()

  const parsed = ManagerProfileSchema.safeParse({
    display_name: formData.get('display_name'),
    home_market: formData.get('home_market'),
    minimum_fee: formData.get('minimum_fee'),
    target_hourly_rate: formData.get('target_hourly_rate'),
    max_drive_minutes: formData.get('max_drive_minutes'),
    max_one_way_miles: formData.get('max_one_way_miles'),
    minimum_notice_days: formData.get('minimum_notice_days'),
    preferred_event_types: formData.get('preferred_event_types'),
    excluded_event_types: formData.get('excluded_event_types'),
    target_markets: formData.get('target_markets'),
    target_brands: formData.get('target_brands'),
    genres: formData.get('genres'),
    equipment_notes: formData.get('equipment_notes'),
    travel_notes: formData.get('travel_notes'),
    deal_breakers: formData.get('deal_breakers'),
    website_url: formData.get('website_url'),
    instagram_url: formData.get('instagram_url'),
    press_kit_url: formData.get('press_kit_url'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    redirectWithError(
      '/admin/manager/profile',
      parsed.error.issues[0]?.message ?? 'Invalid manager profile.'
    )
  }

  const data = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from('manager_profiles')
    .upsert({
      profile_key: 'dj_bae',
      display_name: data.display_name,
      home_market: optionalString(data.home_market),
      minimum_fee: data.minimum_fee,
      target_hourly_rate: data.target_hourly_rate,
      max_drive_minutes: data.max_drive_minutes,
      max_one_way_miles: data.max_one_way_miles,
      minimum_notice_days: data.minimum_notice_days,
      preferred_event_types: splitManagerList(data.preferred_event_types),
      excluded_event_types: splitManagerList(data.excluded_event_types),
      target_markets: splitManagerList(data.target_markets),
      target_brands: splitManagerList(data.target_brands),
      genres: splitManagerList(data.genres),
      equipment_notes: optionalString(data.equipment_notes),
      travel_notes: optionalString(data.travel_notes),
      deal_breakers: optionalString(data.deal_breakers),
      website_url: data.website_url,
      instagram_url: data.instagram_url,
      press_kit_url: data.press_kit_url,
      notes: optionalString(data.notes),
    }, { onConflict: 'profile_key' })

  if (error) {
    redirectWithError('/admin/manager/profile', managerDbError(error))
  }

  revalidatePath('/admin/manager')
  revalidatePath('/admin/manager/profile')
  redirect(`/admin/manager/profile?success=${encodeURIComponent('Manager profile saved.')}`)
}
