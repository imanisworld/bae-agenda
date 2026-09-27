import { getUpcomingEvents } from '@/lib/db/events'
import { getPublishedMixes } from '@/lib/db/mixes'
import { isValidTimeZone } from '@/lib/date-time'
import StyleLabClient from './style-lab-client'
import type { ApprovedEvent, ApprovedMix } from './application-map'

function formatDate(iso: string, timeZone: string | null) {
  const zone = timeZone && isValidTimeZone(timeZone) ? timeZone : 'UTC'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: zone,
  }).format(new Date(iso))
}

function formatClock(iso: string, timeZone: string | null) {
  if (!timeZone || !isValidTimeZone(timeZone)) return null
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso))
}

export default async function StyleLabPage() {
  const [mixes, events] = await Promise.all([
    getPublishedMixes(),
    getUpcomingEvents(3),
  ])

  const approvedMixes: ApprovedMix[] = mixes.map((mix) => ({
    id: mix.id,
    title: mix.title,
    genre: mix.genre,
    coverUrl: mix.cover_url,
    embedUrl: mix.embed_url,
  }))

  const approvedEvents: ApprovedEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    date: formatDate(event.event_date, event.event_timezone),
    time: formatClock(event.event_date, event.event_timezone),
    venue: event.venue,
    city: event.city,
    status: event.featured ? 'Featured' : 'Upcoming',
  }))

  return <StyleLabClient mixes={approvedMixes} events={approvedEvents} />
}
