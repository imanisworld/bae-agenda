'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAuthedUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/admin/login')
}

function redirectWithError(path: string, message: string) {
  const params = new URLSearchParams({ error: message })
  redirect(`${path}?${params.toString()}`)
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function parseTags(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string' || !value.trim()) return []
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

// ── Public read actions ──────────────────────────────────────────────────────

export async function getPortfolioEntries() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('*')
      .order('year', { ascending: false })
      .order('event_name', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

export async function getFeaturedPortfolioEntries() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('*')
      .eq('featured', true)
      .order('year', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

// ── Mutating actions (authenticated) ────────────────────────────────────────

export async function createPortfolioEntryAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()

  const eventName = optionalString(formData.get('event_name'))
  const yearRaw   = formData.get('year')
  const year      = typeof yearRaw === 'string' ? parseInt(yearRaw, 10) : NaN
  const city      = optionalString(formData.get('city'))

  if (!eventName || !city || Number.isNaN(year)) {
    redirectWithError('/admin/portfolio', 'Event name, city, and year are required.')
  }

  const { error } = await admin.from('portfolio_entries').insert({
    event_name: eventName,
    city,
    year,
    venue:     optionalString(formData.get('venue')),
    date:      optionalString(formData.get('date')),
    tags:      parseTags(formData.get('tags')),
    photo_url: optionalString(formData.get('photo_url')),
    featured:  formData.get('featured') === 'on',
    notes:     optionalString(formData.get('notes')),
  })

  if (error) {
    redirectWithError('/admin/portfolio', error.message || 'Unable to create entry.')
  }

  revalidatePath('/admin/portfolio')
  revalidatePath('/portfolio')
  revalidatePath('/')
  redirect('/admin/portfolio')
}

export async function updatePortfolioEntryAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()

  const id        = optionalString(formData.get('id'))
  const eventName = optionalString(formData.get('event_name'))
  const yearRaw   = formData.get('year')
  const year      = typeof yearRaw === 'string' ? parseInt(yearRaw, 10) : NaN
  const city      = optionalString(formData.get('city'))

  if (!id || !eventName || !city || Number.isNaN(year)) {
    redirectWithError('/admin/portfolio', 'Event name, city, and year are required.')
  }

  const { error } = await admin
    .from('portfolio_entries')
    .update({
      event_name: eventName,
      city,
      year,
      venue:     optionalString(formData.get('venue')),
      date:      optionalString(formData.get('date')),
      tags:      parseTags(formData.get('tags')),
      photo_url: optionalString(formData.get('photo_url')),
      featured:  formData.get('featured') === 'on',
      notes:     optionalString(formData.get('notes')),
    })
    .eq('id', id)

  if (error) {
    redirectWithError('/admin/portfolio', error.message || 'Unable to update entry.')
  }

  revalidatePath('/admin/portfolio')
  revalidatePath(`/admin/portfolio/${id}`)
  revalidatePath('/portfolio')
  revalidatePath('/')
  redirect('/admin/portfolio')
}

export async function deletePortfolioEntryAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/portfolio', 'Missing entry id.')

  const { error } = await admin.from('portfolio_entries').delete().eq('id', id)
  if (error) {
    redirectWithError('/admin/portfolio', error.message || 'Unable to delete entry.')
  }

  revalidatePath('/admin/portfolio')
  revalidatePath('/portfolio')
  revalidatePath('/')
  redirect('/admin/portfolio')
}

export async function togglePortfolioFeaturedAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/portfolio', 'Missing entry id.')

  const nextValue = formData.get('next_featured') === 'true'
  const { error } = await admin
    .from('portfolio_entries')
    .update({ featured: nextValue })
    .eq('id', id)

  if (error) {
    redirectWithError('/admin/portfolio', error.message || 'Unable to update featured state.')
  }

  revalidatePath('/admin/portfolio')
  revalidatePath('/portfolio')
  revalidatePath('/')
  redirect('/admin/portfolio')
}
