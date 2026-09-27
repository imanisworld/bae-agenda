import { getLocalDateString } from '@/lib/date-time'

const SITE_SCHEDULE_TIME_ZONE = 'America/Indiana/Indianapolis'

export interface EventScheduleRecord {
  event_date: string
  event_timezone: string | null
}

export function getEventCandidateFloorIso(now = new Date()): string {
  const siteDate = getLocalDateString(now, SITE_SCHEDULE_TIME_ZONE)
  const floor = new Date(`${siteDate}T00:00:00.000Z`)
  floor.setUTCDate(floor.getUTCDate() - 1)
  return floor.toISOString()
}

export function isUpcomingEventRecord(
  event: EventScheduleRecord,
  now = new Date()
): boolean {
  if (event.event_timezone) {
    const instant = new Date(event.event_date)
    return !Number.isNaN(instant.getTime()) && instant.getTime() >= now.getTime()
  }

  // Legacy rows were historically treated as UTC calendar dates.
  // Keep that behavior until an admin explicitly reviews and saves a timezone.
  const siteDate = getLocalDateString(now, SITE_SCHEDULE_TIME_ZONE)
  return event.event_date.slice(0, 10) >= siteDate
}
