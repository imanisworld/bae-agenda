import { createPublicClient } from '@/lib/supabase/public'
import { logError } from '@/lib/monitoring'
import type { Database } from '@/types/database'

export type Mix = Database['public']['Tables']['mixes']['Row']

/**
 * Homepage mixes: featured first.
 * Falls back to latest published mixes if no featured rows exist.
 */
export async function getFeaturedMixes(limit = 3): Promise<Mix[]> {
  try {
    const supabase = createPublicClient()

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

    if (featuredError) {
      logError('Featured mixes query failed; trying fallback', featuredError, {
        operation: 'getFeaturedMixes',
      })
    }

    const { data: fallback, error: fallbackError } = await supabase
      .from('mixes')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(limit)

    if (fallbackError) {
      logError('Mixes fallback query failed', fallbackError, {
        operation: 'getFeaturedMixes',
      })
      return []
    }

    return fallback ?? []
  } catch (error) {
    logError('Featured mixes load failed', error, { operation: 'getFeaturedMixes' })
    return []
  }
}

/**
 * Full mixes page list.
 */
export async function getPublishedMixes(limit = 50): Promise<Mix[]> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('mixes')
      .select('*')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(limit)

    if (error) {
      logError('Published mixes query failed', error, { operation: 'getPublishedMixes' })
      return []
    }
    return data ?? []
  } catch (error) {
    logError('Published mixes load failed', error, { operation: 'getPublishedMixes' })
    return []
  }
}
