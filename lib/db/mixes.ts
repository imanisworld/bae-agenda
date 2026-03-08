import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type Mix = Database['public']['Tables']['mixes']['Row']

/**
 * Homepage mixes: featured first.
 * Falls back to latest published mixes if no featured rows exist.
 */
export async function getFeaturedMixes(limit = 3): Promise<Mix[]> {
  try {
    const supabase = await createClient()

    const { data: featured, error: featuredError } = await supabase
      .from('mixes')
      .select('*')
      .eq('is_featured', true)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(limit)

    if (!featuredError && featured && featured.length > 0) {
      return featured
    }

    const { data: fallback, error: fallbackError } = await supabase
      .from('mixes')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(limit)

    if (fallbackError) {
      return []
    }

    return fallback ?? []
  } catch {
    return []
  }
}

/**
 * Full mixes page list.
 */
export async function getPublishedMixes(limit = 50): Promise<Mix[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mixes')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(limit)

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}
