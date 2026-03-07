/**
 * EVENTS — Database helpers
 * Server-side only. All queries filter to public = true.
 * "Upcoming" is determined by event_date >= now() — no status column needed.
 */
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type Event = Database['public']['Tables']['events']['Row']

/**
 * All upcoming public events, soonest first.
 * Used for the /events listing page.
 */
export async function getUpcomingEvents(limit = 10): Promise<Event[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('public', true)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[getUpcomingEvents]', error.message)
    return []
  }
  return data ?? []
}

/**
 * Featured public events for the homepage — up to 3.
 * Falls back to the next 3 upcoming events if none are marked featured.
 */
export async function getFeaturedEvents(): Promise<Event[]> {
  const supabase = await createClient()

  const { data: featured, error } = await supabase
    .from('events')
    .select('*')
    .eq('public', true)
    .eq('featured', true)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(3)

  if (error) {
    console.error('[getFeaturedEvents]', error.message)
    return []
  }

  if (featured && featured.length > 0) return featured

  // Fallback: next 3 upcoming public events
  const { data: upcoming, error: fallbackError } = await supabase
    .from('events')
    .select('*')
    .eq('public', true)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(3)

  if (fallbackError) {
    console.error('[getFeaturedEvents:fallback]', fallbackError.message)
    return []
  }
  return upcoming ?? []
}
