import type { Metadata } from 'next'
import EventExperienceStage from '@/components/public/EventExperienceStage'
import { getPastEvents, getUpcomingEvents } from '@/lib/db/events'

export const dynamic = 'force-dynamic'

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

export default async function EventsPage() {
  const [events, pastEvents] = await Promise.all([getUpcomingEvents(50), getPastEvents(20)])
  return <EventExperienceStage events={events} pastEvents={pastEvents} />
}
