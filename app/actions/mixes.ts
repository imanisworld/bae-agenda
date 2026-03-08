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

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return parsed
}

function parseDateTimeLocal(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function revalidateMixPaths() {
  revalidatePath('/admin/mixes')
  revalidatePath('/mixes')
  revalidatePath('/')
}

export async function createMixAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()

  const titleRaw = formData.get('title')
  if (typeof titleRaw !== 'string' || !titleRaw.trim()) {
    redirect('/admin/mixes/new')
  }

  const published = formData.get('published') === 'on'
  const publishedAtInput = parseDateTimeLocal(formData.get('published_at'))
  const publishedAt = published ? publishedAtInput ?? new Date().toISOString() : null

  await admin.from('mixes').insert({
    title: titleRaw.trim(),
    description: optionalString(formData.get('description')),
    genre: optionalString(formData.get('genre')),
    duration: optionalNumber(formData.get('duration')),
    embed_url: optionalString(formData.get('embed_url')),
    cover_url: optionalString(formData.get('cover_url')),
    is_featured: formData.get('is_featured') === 'on',
    sort_order: optionalNumber(formData.get('sort_order')) ?? 0,
    published_at: publishedAt,
  })

  revalidateMixPaths()
  redirect('/admin/mixes')
}

export async function updateMixAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()

  const id = optionalString(formData.get('id'))
  const titleRaw = formData.get('title')
  if (!id || typeof titleRaw !== 'string' || !titleRaw.trim()) {
    redirect('/admin/mixes')
  }

  const published = formData.get('published') === 'on'
  const publishedAtInput = parseDateTimeLocal(formData.get('published_at'))
  const publishedAt = published ? publishedAtInput ?? new Date().toISOString() : null

  await admin
    .from('mixes')
    .update({
      title: titleRaw.trim(),
      description: optionalString(formData.get('description')),
      genre: optionalString(formData.get('genre')),
      duration: optionalNumber(formData.get('duration')),
      embed_url: optionalString(formData.get('embed_url')),
      cover_url: optionalString(formData.get('cover_url')),
      is_featured: formData.get('is_featured') === 'on',
      sort_order: optionalNumber(formData.get('sort_order')) ?? 0,
      published_at: publishedAt,
    })
    .eq('id', id)

  revalidateMixPaths()
  revalidatePath(`/admin/mixes/${id}`)
  redirect('/admin/mixes')
}

export async function deleteMixAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirect('/admin/mixes')

  await admin.from('mixes').delete().eq('id', id)

  revalidateMixPaths()
  redirect('/admin/mixes')
}

export async function toggleMixFeaturedAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirect('/admin/mixes')

  const nextFeatured = formData.get('next_featured') === 'true'
  await admin.from('mixes').update({ is_featured: nextFeatured }).eq('id', id)

  revalidateMixPaths()
  redirect('/admin/mixes')
}

export async function toggleMixPublishedAction(formData: FormData) {
  await requireAuthedUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirect('/admin/mixes')

  const nextPublished = formData.get('next_published') === 'true'
  await admin
    .from('mixes')
    .update({ published_at: nextPublished ? new Date().toISOString() : null })
    .eq('id', id)

  revalidateMixPaths()
  redirect('/admin/mixes')
}
