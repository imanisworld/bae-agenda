import type { Metadata } from 'next'
import EventExperienceStage from '@/components/public/EventExperienceStage'
import { getUpcomingEvents } from '@/lib/db/events'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Events',
  alternates: { canonical: '/events' },
  description: 'Upcoming DJ sets, club nights, and appearances by DJ B.A.E. — Indianapolis based, available for travel.',
}

export default async function EventsPage() {
  const events = await getUpcomingEvents(50)
  return <EventExperienceStage events={events} />
}
