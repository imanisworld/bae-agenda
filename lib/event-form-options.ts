export const EVENT_CITY_OPTIONS = [
  'Chicago, IL',
  'Oak Park, IL',
  'Evanston, IL',
  'Naperville, IL',
  'Schaumburg, IL',
  'Milwaukee, WI',
  'Indianapolis, IN',
  'Atlanta, GA',
] as const

export const EVENT_TIMEZONE_OPTIONS = [
  { value: 'America/Indiana/Indianapolis', label: 'Eastern — Indianapolis' },
  { value: 'America/New_York', label: 'Eastern — New York / Atlanta' },
  { value: 'America/Chicago', label: 'Central — Chicago / Milwaukee' },
  { value: 'America/Denver', label: 'Mountain — Denver' },
  { value: 'America/Phoenix', label: 'Mountain — Arizona (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific — Los Angeles' },
] as const

const CITY_TIME_ZONES: Record<string, string> = {
  'chicago, il': 'America/Chicago',
  'oak park, il': 'America/Chicago',
  'evanston, il': 'America/Chicago',
  'naperville, il': 'America/Chicago',
  'schaumburg, il': 'America/Chicago',
  'milwaukee, wi': 'America/Chicago',
  'indianapolis, in': 'America/Indiana/Indianapolis',
  'atlanta, ga': 'America/New_York',
}

export function suggestEventTimeZone(city: string | null | undefined): string | null {
  const normalized = city?.trim().toLowerCase()
  if (!normalized) return null
  return CITY_TIME_ZONES[normalized] ?? null
}
