/**
 * CONTENT — Database helpers for site_content table.
 * Server-side only. Public read policy covers unauthenticated reads.
 */
import { createClient } from '@/lib/supabase/server'

export type ContentItem = {
  id:         string
  key:        string
  value:      string | null
  label:      string | null
  updated_at: string
}

/**
 * Fetch all site_content rows — used by admin editor.
 * Returns empty array on any error so the admin page never crashes.
 */
export async function getAllContent(): Promise<ContentItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('key', { ascending: true })

    if (error) {
      console.error('[getAllContent]', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[getAllContent] unexpected:', err)
    return []
  }
}

/**
 * Fetch specific keys from site_content and return as a key→value map.
 * Missing keys are simply absent from the map — callers should use CONTENT_DEFAULTS.
 * Used by public site Server Components.
 */
export async function getContentMap(
  keys: string[]
): Promise<Record<string, string>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_content')
      .select('key, value')
      .in('key', keys)

    if (error) {
      console.error('[getContentMap]', error.message)
      return {}
    }

    const map: Record<string, string> = {}
    // Explicit cast — Supabase TypeScript strict generics infer partial selects as `never`
    const rows = (data ?? []) as Array<{ key: string; value: string | null }>
    for (const row of rows) {
      if (row.value !== null && row.value !== undefined && row.value !== '') {
        map[row.key] = row.value
      }
    }
    return map
  } catch {
    return {}
  }
}
