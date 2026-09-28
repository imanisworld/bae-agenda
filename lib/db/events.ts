/**
 * EVENTS — Database helpers
 * Server-side only. All queries filter to public = true.
 *
 * Reviewed events (event_timezone != null) use their real UTC instant for
 * upcoming/past checks. Legacy rows keep date-only behavior until reviewed.
 */
import { createClient } from '@/lib/supabase/server'
import { getEventCandidateFloorIso, isUpcomingEventRecord } from '@/lib/event-schedule'
import type { Database } from '@/types/database'

export type Event = Database['public']['Tables']['events']['Row']

async function loadUpcomingCandidates(limit: number, featuredOnly = false): Promise<Event[]> {
  const supabase = await createClient()
  let query = supabase
    .from('events')
    .select('*')
    .eq('public', true)
    .gte('event_date', getEventCandidateFloorIso())
    .order('event_date', { ascending: true })

  if (featuredOnly) query = query.eq('featured', true)

  const { data, error } = await query.limit(Math.max(limit * 4, 50))

  if (error) {
    console.error('[events] unable to load candidates:', error.message)
    return []
  }

  const now = new Date()
  return ((data ?? []) as Event[]).filter((event) => isUpcomingEventRecord(event, now)).slice(0, limit)
}

/**
 * All upcoming public events, soonest first.
 * Used for the /events listing page.
 */
export async function getUpcomingEvents(limit = 10): Promise<Event[]> {
  try {
    return await loadUpcomingCandidates(limit)
  } catch (err) {
    console.error('[getUpcomingEvents] unexpected error:', err)
    return []
  }
}

/**
 * Past public events, most recent first.
 * Used for the "Past" view on the /events page.
 */
export async function getPastEvents(limit = 20): Promise<Event[]> {
  try {
    const supabase = await createClient()
    // Include the last couple of days so same-day events that already ended are caught;
    // isUpcomingEventRecord makes the final call.
    const ceiling = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('public', true)
      .lt('event_date', ceiling)
      .order('event_date', { ascending: false })
      .limit(limit + 10)

    if (error) {
      console.error('[getPastEvents] unable to load events:', error.message)
      return []
    }

    const now = new Date()
    return ((data ?? []) as Event[]).filter((event) => !isUpcomingEventRecord(event, now)).slice(0, limit)
  } catch (err) {
    console.error('[getPastEvents] unexpected error:', err)
    return []
  }
}

/**
 * Featured public events for the homepage — up to 3.
 * Falls back to the next 3 upcoming events if none are marked featured.
 */
export async function getFeaturedEvents(): Promise<Event[]> {
  try {
    const featured = await loadUpcomingCandidates(3, true)
    if (featured.length > 0) return featured
    return await loadUpcomingCandidates(3)
  } catch (err) {
    console.error('[getFeaturedEvents] unexpected error:', err)
    return []
  }
}
