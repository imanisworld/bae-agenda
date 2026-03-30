export const EVENT_CITY_OPTIONS = [
  'Chicago, IL',
  'Oak Park, IL',
  'Evanston, IL',
  'Naperville, IL',
  'Schaumburg, IL',
  'Milwaukee, WI',
  'Indianapolis, IN',
] as const

export const EVENT_TIME_OPTIONS = buildTimeOptions()

function buildTimeOptions() {
  const options: Array<{ value: string; label: string }> = []

  for (let hour = 10; hour <= 23; hour++) {
    options.push({ value: `${String(hour).padStart(2, '0')}:00`, label: formatTimeLabel(hour, 0) })
    options.push({ value: `${String(hour).padStart(2, '0')}:30`, label: formatTimeLabel(hour, 30) })
  }

  return options
}

function formatTimeLabel(hour: number, minute: number) {
  const h = hour % 12 || 12
  return `${h}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}
