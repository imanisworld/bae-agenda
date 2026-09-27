'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin-auth'

function redirectWithError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message })
  redirect(`${path}?${params.toString()}`)
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
  revalidatePath('/lab')
  revalidatePath('/mixes')
  revalidatePath('/')
}

export async function createMixAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const titleRaw = formData.get('title')
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : ''
  if (!title) {
    redirectWithError('/admin/mixes', 'Title is required to create a mix.')
  }

  const published = formData.get('published') === 'on'
  const publishedAtInput = parseDateTimeLocal(formData.get('published_at'))
  const publishedAt = published ? publishedAtInput ?? new Date().toISOString() : null

  const { error } = await admin.from('mixes').insert({
    title,
    description: optionalString(formData.get('description')),
    genre: optionalString(formData.get('genre')),
    duration: optionalNumber(formData.get('duration')),
    embed_url: optionalString(formData.get('embed_url')),
    cover_url: optionalString(formData.get('cover_url')),
    is_featured: formData.get('is_featured') === 'on',
    sort_order: optionalNumber(formData.get('sort_order')) ?? 0,
    published_at: publishedAt,
  })
  if (error) {
    redirectWithError('/admin/mixes', error.message || 'Unable to create mix.')
  }

  revalidateMixPaths()
  redirect('/admin/mixes')
}

export async function updateMixAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()

  const id = optionalString(formData.get('id'))
  const titleRaw = formData.get('title')
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : ''
  if (!id || !title) {
    redirectWithError('/admin/mixes', 'Title is required to update a mix.')
  }

  const published = formData.get('published') === 'on'
  const publishedAtInput = parseDateTimeLocal(formData.get('published_at'))
  const publishedAt = published ? publishedAtInput ?? new Date().toISOString() : null

  const { error } = await admin
    .from('mixes')
    .update({
      title,
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
  if (error) {
    redirectWithError('/admin/mixes', error.message || 'Unable to update mix.')
  }

  revalidateMixPaths()
  revalidatePath(`/admin/mixes/${id}`)
  redirect('/admin/mixes')
}

export async function deleteMixAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/mixes', 'Missing mix id.')

  const { error } = await admin.from('mixes').delete().eq('id', id)
  if (error) {
    redirectWithError('/admin/mixes', error.message || 'Unable to delete mix.')
  }

  revalidateMixPaths()
  redirect('/admin/mixes')
}

export async function toggleMixFeaturedAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/mixes', 'Missing mix id.')

  const nextFeatured = formData.get('next_featured') === 'true'
  const { error } = await admin.from('mixes').update({ is_featured: nextFeatured }).eq('id', id)
  if (error) {
    redirectWithError('/admin/mixes', error.message || 'Unable to update featured state.')
  }

  revalidateMixPaths()
  redirect('/admin/mixes')
}

export async function toggleMixPublishedAction(formData: FormData) {
  await requireAdminUser()
  const admin = createAdminClient()
  const id = optionalString(formData.get('id'))
  if (!id) redirectWithError('/admin/mixes', 'Missing mix id.')

  const nextPublished = formData.get('next_published') === 'true'
  const { error } = await admin
    .from('mixes')
    .update({ published_at: nextPublished ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) {
    redirectWithError('/admin/mixes', error.message || 'Unable to update publish state.')
  }

  revalidateMixPaths()
  redirect('/admin/mixes')
}
