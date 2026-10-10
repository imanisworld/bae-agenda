/**
 * EVENTS — Database helpers
 * Server-side only. All queries filter to public = true.
 *
 * Reviewed events (event_timezone != null) use their real UTC instant for
 * upcoming/past checks. Legacy rows keep date-only behavior until reviewed.
 */
import { createPublicClient } from '@/lib/supabase/public'
import { getEventCandidateFloorIso, isUpcomingEventRecord } from '@/lib/event-schedule'
import type { Database } from '@/types/database'

type EventRow = Database['public']['Tables']['events']['Row']
type EventMediaRow = Database['public']['Tables']['event_media']['Row']

export type Event = Omit<EventRow, 'booking_id'>
export type EventMedia = Pick<
  EventMediaRow,
  'id' | 'event_id' | 'media_type' | 'media_url' | 'poster_url' | 'caption' | 'sort_order'
>

// TBA announcements do not get invented times or venues. The database events
// table requires a date, so these are public presentation-only notices until
// confirmed dates exist. See GitHub issue #171 for an admin-managed TBA model.
const CLUB_CUNT_SLUG = 'club-cunt-oct-31-2026'
const CLUB_CUNT_ID = '372bf342-7e6b-4202-9e81-a55cf279f5c0'

const TBA_ANNOUNCEMENTS: Event[] = [
  {
    id: CLUB_CUNT_ID,
    title: 'Club Cunt',
    slug: CLUB_CUNT_SLUG,
    event_date: '',
    event_timezone: null,
    venue: null,
    city: null,
    description: 'Date and location TBA.',
    show_description: true,
    public: true,
    featured: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'saints-and-sinners-halloween-tba',
    title: 'Saints and Sinners',
    slug: 'saints-and-sinners-halloween-tba',
    event_date: '',
    event_timezone: null,
    venue: null,
    city: null,
    description: 'Halloween party · Details TBA.',
    show_description: true,
    public: true,
    featured: false,
    created_at: '',
    updated_at: '',
  },
]
const isTbaAnnouncement = (event: Event) => event.slug === CLUB_CUNT_SLUG
  || event.slug === 'saints-and-sinners-halloween-tba'

const PUBLIC_EVENT_COLUMNS =
  'id,title,slug,event_date,event_timezone,venue,city,description,public,featured,show_description,created_at,updated_at' as const

async function loadUpcomingCandidates(limit: number, featuredOnly = false): Promise<Event[]> {
  const supabase = createPublicClient()
  let query = supabase
    .from('events')
    .select(PUBLIC_EVENT_COLUMNS)
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
  return ((data ?? []) as Event[])
    .filter((event) => !isTbaAnnouncement(event))
    .filter((event) => isUpcomingEventRecord(event, now))
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, limit)
}

/**
 * All upcoming public events, soonest first.
 * Used for the /events listing page.
 */
export async function getUpcomingEvents(limit = 10): Promise<Event[]> {
  try {
    const datedEvents = await loadUpcomingCandidates(limit)
    return [...datedEvents, ...TBA_ANNOUNCEMENTS].slice(0, limit)
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
    const supabase = createPublicClient()
    // Include the last couple of days so same-day events that already ended are caught;
    // isUpcomingEventRecord makes the final call.
    const ceiling = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('events')
      .select(PUBLIC_EVENT_COLUMNS)
      .eq('public', true)
      .lt('event_date', ceiling)
      .order('event_date', { ascending: false })
      .limit(limit + 10)

    if (error) {
      console.error('[getPastEvents] unable to load events:', error.message)
      return []
    }

    const now = new Date()
    return ((data ?? []) as Event[])
      .filter((event) => !isTbaAnnouncement(event))
      .filter((event) => !isUpcomingEventRecord(event, now))
      .sort((a, b) => b.event_date.localeCompare(a.event_date))
      .slice(0, limit)
  } catch (err) {
    console.error('[getPastEvents] unexpected error:', err)
    return []
  }
}

/**
 * Public photo/video records for event archive galleries.
 */
export async function getPublicEventMedia(eventIds: string[]): Promise<EventMedia[]> {
  const uniqueIds = [...new Set(eventIds.filter(Boolean))]
  if (uniqueIds.length === 0) return []

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('event_media')
      .select('id,event_id,media_type,media_url,poster_url,caption,sort_order')
      .in('event_id', uniqueIds)
      .eq('public', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[getPublicEventMedia] unable to load media:', error.message)
      return []
    }

    return (data ?? []) as EventMedia[]
  } catch (err) {
    console.error('[getPublicEventMedia] unexpected error:', err)
    return []
  }
}

/**
 * One public event by slug for the indexable event detail route.
 * Internal booking linkage is deliberately excluded by PUBLIC_EVENT_COLUMNS.
 */
export async function getPublicEventBySlug(slug: string): Promise<Event | null> {
  const notice = TBA_ANNOUNCEMENTS.find((event) => event.slug === slug)
  if (notice) return notice
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('events')
      .select(PUBLIC_EVENT_COLUMNS)
      .eq('public', true)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('[getPublicEventBySlug] unable to load event:', error.message)
      return null
    }

    return data as Event | null
  } catch (err) {
    console.error('[getPublicEventBySlug] unexpected error:', err)
    return null
  }
}

/**
 * Public event URLs for sitemap discovery. Keep only public-safe fields.
 */
export async function getPublicEventSitemapEntries(): Promise<Array<{ slug: string; updated_at: string }>> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('events')
      .select('slug,updated_at')
      .eq('public', true)
      .order('event_date', { ascending: false })
      .limit(500)

    if (error) {
      console.error('[getPublicEventSitemapEntries] unable to load events:', error.message)
      return []
    }

    const entries = (data ?? []) as Array<{ slug: string | null; updated_at: string }>
    return entries
      .filter((event) => typeof event.slug === 'string' && event.slug.trim().length > 0)
      .map((event) => ({ slug: event.slug as string, updated_at: event.updated_at }))
  } catch (err) {
    console.error('[getPublicEventSitemapEntries] unexpected error:', err)
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
