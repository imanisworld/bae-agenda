import type { Metadata } from 'next'
import EventExperienceStage from '@/components/public/EventExperienceStage'
import { getPastEvents, getPublicEventMedia, getUpcomingEvents } from '@/lib/db/events'
import type { Event } from '@/lib/db/events'

/** Served from cache and rebuilt in the background at most every 5 minutes; admin saves refresh it immediately (revalidatePath). */
export const revalidate = 300

const EVENTS_OG_IMAGE = '/photos/PlexMix19-DJBAE.JPEG'
const EVENTS_TITLE = 'DJ B.A.E. Events | Indianapolis DJ'

export const metadata: Metadata = {
  title: { absolute: EVENTS_TITLE },
  alternates: { canonical: '/events' },
  description: 'Upcoming DJ sets, club nights, and public appearances by DJ B.A.E. in Indianapolis and select travel dates.',
  openGraph: {
    title: EVENTS_TITLE,
    description: 'Upcoming DJ sets, club nights, and public appearances by DJ B.A.E.',
    url: 'https://thebaeagenda.com/events',
    images: [{ url: EVENTS_OG_IMAGE, width: 1637, height: 1411, alt: 'DJ B.A.E. performing live' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: EVENTS_TITLE,
    description: 'Upcoming DJ sets, club nights, and public appearances by DJ B.A.E.',
    images: [EVENTS_OG_IMAGE],
  },
}

// Presentation-only previews until the start times and guest DJ are verified.
// A midnight UTC sentinel records the stated calendar day, never an event time.
// These entries cannot appear on the production site or in its event sitemap.
const sundaySundayPreview: Event[] = [
  {
    id: 'sunday-sunday-oct-18-preview',
    slug: 'sunday-sunday-oct-18-2026-preview',
    title: 'Sunday Sunday',
    event_date: '2026-10-18T00:00:00.000Z',
    event_timezone: null,
    venue: 'Saints and Sinners',
    city: 'Indianapolis, IN',
    description: 'DJ B.A.E. · October 18. Start time and official flyer pending.',
    show_description: true,
    public: false,
    featured: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'sunday-sunday-oct-25-preview',
    slug: 'sunday-sunday-oct-25-2026-preview',
    title: 'Sunday Sunday',
    event_date: '2026-10-25T00:00:00.000Z',
    event_timezone: null,
    venue: 'Saints and Sinners',
    city: 'Indianapolis, IN',
    description: 'Guest DJ this week while DJ B.A.E. is out of town. Guest name, start time and official flyer pending.',
    show_description: true,
    public: false,
    featured: false,
    created_at: '',
    updated_at: '',
  },
]

export default async function EventsPage() {
  const [events, pastEvents] = await Promise.all([getUpcomingEvents(50), getPastEvents(20)])
  const pastEventMedia = await getPublicEventMedia(pastEvents.map((event) => event.id))

  const showDrafts = process.env.VERCEL_ENV === 'preview'
    || process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'staging'
    || process.env.NODE_ENV === 'development'
  const previewUpcoming = sundaySundayPreview[1]
  const previewPast = sundaySundayPreview[0]
  const displayUpcoming = showDrafts && !events.some((event) => event.slug === 'sunday-sunday-oct-25-2026')
    ? [previewUpcoming, ...events]
    : events
  const displayPast = showDrafts && !pastEvents.some((event) => event.slug === 'sunday-sunday-oct-18-2026')
    ? [previewPast, ...pastEvents]
    : pastEvents

  return (
    <EventExperienceStage
      events={displayUpcoming}
      pastEvents={displayPast}
      pastEventMedia={pastEventMedia}
    />
  )
}
