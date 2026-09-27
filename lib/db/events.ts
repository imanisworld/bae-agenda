/**
 * EVENTS — Database helpers
 * Server-side only. All queries filter to public = true.
 * "Upcoming" is determined by event_date >= now() — no status column needed.
 */
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type Event = Database['public']['Tables']['events']['Row']

const SITE_SCHEDULE_TIME_ZONE = 'America/Indiana/Indianapolis'

function getScheduleDateFloorIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SITE_SCHEDULE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    return now.toISOString().slice(0, 10) + 'T00:00:00.000Z'
  }

  return `${year}-${month}-${day}T00:00:00.000Z`
}

/**
 * All upcoming public events, soonest first.
 * Used for the /events listing page.
 */
export async function getUpcomingEvents(limit = 10): Promise<Event[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('public', true)
      .gte('event_date', getScheduleDateFloorIso())
      .order('event_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[getUpcomingEvents]', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[getUpcomingEvents] unexpected error:', err)
    return []
  }
}

/**
 * Featured public events for the homepage — up to 3.
 * Falls back to the next 3 upcoming events if none are marked featured.
 */
export async function getFeaturedEvents(): Promise<Event[]> {
  try {
    const supabase = await createClient()

    const { data: featured, error } = await supabase
      .from('events')
      .select('*')
      .eq('public', true)
      .eq('featured', true)
      .gte('event_date', getScheduleDateFloorIso())
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
      .gte('event_date', getScheduleDateFloorIso())
      .order('event_date', { ascending: true })
      .limit(3)

    if (fallbackError) {
      console.error('[getFeaturedEvents:fallback]', fallbackError.message)
      return []
    }
    return upcoming ?? []
  } catch (err) {
    console.error('[getFeaturedEvents] unexpected error:', err)
    return []
  }
  
}
