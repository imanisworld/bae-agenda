'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface PortfolioEntry {
  id:         string
  event_name: string
  venue:      string | null
  city:       string
  state:      string | null
  year:       number
  date:       string | null
  tags:       string[]
  photo_url:  string | null
  featured:   boolean
  status:     string
  notes:      string | null
  created_at: string
  updated_at: string
}

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

export async function getPortfolioEntries(): Promise<PortfolioEntry[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('*')
      .order('year', { ascending: false })
      .order('event_name', { ascending: true })
    return (data ?? []) as PortfolioEntry[]
  } catch {
    return []
  }
}

export async function getFeaturedPortfolioEntries(): Promise<PortfolioEntry[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('*')
      .eq('featured', true)
      .order('year', { ascending: false })
      .limit(6)
    return (data ?? []) as PortfolioEntry[]
  } catch {
    return []
  }
}

export async function getPortfolioStats() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('year, city, featured')
    if (!data) return { total: 0, cities: 0, yearsActive: '—', featured: 0 }

    const rows    = data as { year: number; city: string; featured: boolean }[]
    const years   = [...new Set(rows.map((e) => e.year))]
    const cities  = [...new Set(rows.map((e) => e.city.split(',')[0].trim()))].length
    const featured = rows.filter((e) => e.featured).length
    const minYear  = years.length ? Math.min(...years) : new Date().getFullYear()
    const yearsActive = `${minYear}–${new Date().getFullYear()}`

    return { total: rows.length, cities, yearsActive, featured }
  } catch {
    return { total: 0, cities: 0, yearsActive: '—', featured: 0 }
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
    state:     optionalString(formData.get('state')),
    date:      optionalString(formData.get('date')),
    tags:      parseTags(formData.get('tags')),
    photo_url: optionalString(formData.get('photo_url')),
    featured:  formData.get('featured') === 'on',
    status:    formData.get('status') === 'draft' ? 'draft' : 'published',
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
      state:     optionalString(formData.get('state')),
      date:      optionalString(formData.get('date')),
      tags:      parseTags(formData.get('tags')),
      photo_url: optionalString(formData.get('photo_url')),
      featured:  formData.get('featured') === 'on',
      status:    formData.get('status') === 'draft' ? 'draft' : 'published',
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

export async function togglePortfolioStatusAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/portfolio', 'Missing entry id.')

  const nextStatus = formData.get('next_status') === 'draft' ? 'draft' : 'published'
  const { error } = await admin
    .from('portfolio_entries')
    .update({ status: nextStatus })
    .eq('id', id)

  if (error) {
    redirectWithError('/admin/portfolio', error.message || 'Unable to update status.')
  }

  revalidatePath('/admin/portfolio')
  revalidatePath('/portfolio')
  revalidatePath('/')
  redirect('/admin/portfolio')
}
