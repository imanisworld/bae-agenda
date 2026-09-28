'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireAdminUser } from '@/lib/admin-auth'

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

export interface PortfolioMedia {
  id: string
  portfolio_entry_id: string
  media_type: 'image' | 'video'
  media_url: string
  poster_url: string | null
  caption: string | null
  sort_order: number
  public: boolean
  created_at: string
  updated_at: string
}

function redirectWithError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message })
  redirect(`${path}?${params.toString()}`)
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}


function requiredHttpUrl(value: FormDataEntryValue | null): string | null {
  const raw = optionalString(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function optionalHttpUrl(value: FormDataEntryValue | null): string | null {
  const raw = optionalString(value)
  if (!raw) return null
  return requiredHttpUrl(raw)
}

function parseSortOrder(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.trim()) return 0
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
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

export async function getPortfolioMedia(entryIds: string[]): Promise<PortfolioMedia[]> {
  const ids = [...new Set(entryIds.filter(Boolean))]
  if (ids.length === 0) return []

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('portfolio_media')
      .select('id, portfolio_entry_id, media_type, media_url, poster_url, caption, sort_order, public, created_at, updated_at')
      .in('portfolio_entry_id', ids)
      .eq('public', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[getPortfolioMedia] unable to load media:', error.message)
      return []
    }

    return (data ?? []) as PortfolioMedia[]
  } catch (error) {
    console.error('[getPortfolioMedia] unexpected error:', error)
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
  await requireAdminUser()
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
  await requireAdminUser()
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
  await requireAdminUser()
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
  await requireAdminUser()
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
  await requireAdminUser()
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


export async function addPortfolioMediaAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const entryId = optionalString(formData.get('portfolio_entry_id'))
  const mediaType = optionalString(formData.get('media_type'))
  const mediaUrl = requiredHttpUrl(formData.get('media_url'))
  const posterUrl = optionalHttpUrl(formData.get('poster_url'))

  if (!entryId || (mediaType !== 'image' && mediaType !== 'video') || !mediaUrl) {
    redirectWithError(
      entryId ? `/admin/portfolio/${entryId}` : '/admin/portfolio',
      'Portfolio entry, media type, and a valid http(s) media URL are required.'
    )
  }

  const { error } = await admin.from('portfolio_media').insert({
    portfolio_entry_id: entryId,
    media_type: mediaType,
    media_url: mediaUrl,
    poster_url: posterUrl,
    caption: optionalString(formData.get('caption')),
    sort_order: parseSortOrder(formData.get('sort_order')),
    public: formData.get('public') === 'on',
  })

  if (error) {
    redirectWithError(`/admin/portfolio/${entryId}`, error.message || 'Unable to add portfolio media.')
  }

  revalidatePath(`/admin/portfolio/${entryId}`)
  revalidatePath('/portfolio')
  revalidatePath('/')
  redirect(`/admin/portfolio/${entryId}?success=Media%20added`)
}

export async function updatePortfolioMediaAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const entryId = optionalString(formData.get('portfolio_entry_id'))
  const mediaId = optionalString(formData.get('media_id'))
  const posterUrl = optionalHttpUrl(formData.get('poster_url'))

  if (!entryId || !mediaId) {
    redirectWithError('/admin/portfolio', 'Missing portfolio media id.')
  }

  const { error } = await admin
    .from('portfolio_media')
    .update({
      poster_url: posterUrl,
      caption: optionalString(formData.get('caption')),
      sort_order: parseSortOrder(formData.get('sort_order')),
      public: formData.get('public') === 'on',
    })
    .eq('id', mediaId)
    .eq('portfolio_entry_id', entryId)

  if (error) {
    redirectWithError(`/admin/portfolio/${entryId}`, error.message || 'Unable to update portfolio media.')
  }

  revalidatePath(`/admin/portfolio/${entryId}`)
  revalidatePath('/portfolio')
  revalidatePath('/')
  redirect(`/admin/portfolio/${entryId}?success=Media%20updated`)
}

export async function deletePortfolioMediaAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const entryId = optionalString(formData.get('portfolio_entry_id'))
  const mediaId = optionalString(formData.get('media_id'))

  if (!entryId || !mediaId) {
    redirectWithError('/admin/portfolio', 'Missing portfolio media id.')
  }

  const { error } = await admin
    .from('portfolio_media')
    .delete()
    .eq('id', mediaId)
    .eq('portfolio_entry_id', entryId)

  if (error) {
    redirectWithError(`/admin/portfolio/${entryId}`, error.message || 'Unable to remove portfolio media.')
  }

  revalidatePath(`/admin/portfolio/${entryId}`)
  revalidatePath('/portfolio')
  revalidatePath('/')
  redirect(`/admin/portfolio/${entryId}?success=Media%20removed`)
}
