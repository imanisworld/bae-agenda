import type { Metadata } from 'next'
import EventExperienceStage from '@/components/public/EventExperienceStage'
import { getPastEvents, getUpcomingEvents } from '@/lib/db/events'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events',
  alternates: { canonical: '/events' },
  description: 'Upcoming DJ sets, club nights, and appearances by DJ B.A.E. — Indianapolis based, available for travel.',
}

export default async function EventsPage() {
  const [events, pastEvents] = await Promise.all([getUpcomingEvents(50), getPastEvents(20)])
  return <EventExperienceStage events={events} pastEvents={pastEvents} />
}
