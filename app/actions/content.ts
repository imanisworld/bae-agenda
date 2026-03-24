'use server'
/**
 * CONTENT SERVER ACTIONS
 * Saves site_content updates to Supabase using the service role key.
 * Uses upsert so records are created if they don't exist yet.
 * Revalidates the homepage and content page after every save.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser }  from '@/lib/admin-auth'
import { revalidatePath }    from 'next/cache'

export interface ContentUpdate {
  key:    string
  value:  string
  label?: string
}

export async function saveContentItems(
  updates: ContentUpdate[]
): Promise<{ success: boolean; error?: string }> {
  if (!updates.length) return { success: true }

  try {
    await requireAdminUser()

    const supabase = createAdminClient()

    const rows = updates.map(u => ({
      key:   u.key,
      value: u.value,
      label: u.label ?? null,
    }))

    const { error } = await supabase
      .from('site_content')
      .upsert(rows, { onConflict: 'key' })

    if (error) return { success: false, error: error.message }

    // Revalidate so the public site and admin page both reflect the new values
    revalidatePath('/', 'layout')
    revalidatePath('/admin/content')

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error saving content.'
    return { success: false, error: msg }
  }
}
