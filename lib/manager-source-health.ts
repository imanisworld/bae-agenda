export type ManagerSourceCheckState = 'never' | 'due' | 'current' | 'paused'

export function managerSourceCheckState(input: {
  active: boolean
  last_checked_at: string | null
  check_frequency_hours: number
}, now = new Date()): ManagerSourceCheckState {
  if (!input.active) return 'paused'
  if (!input.last_checked_at) return 'never'

  const checked = new Date(input.last_checked_at).getTime()
  const cadenceMs = Math.max(1, input.check_frequency_hours) * 60 * 60 * 1000
  if (!Number.isFinite(checked)) return 'due'
  return now.getTime() >= checked + cadenceMs ? 'due' : 'current'
}

export function managerSourceNextCheckAt(input: {
  last_checked_at: string | null
  check_frequency_hours: number
}) {
  if (!input.last_checked_at) return null
  const checked = new Date(input.last_checked_at).getTime()
  if (!Number.isFinite(checked)) return null
  return new Date(checked + Math.max(1, input.check_frequency_hours) * 60 * 60 * 1000)
}

export function managerSourceCheckLabel(state: ManagerSourceCheckState) {
  if (state === 'never') return 'Never checked'
  if (state === 'due') return 'Due'
  if (state === 'current') return 'Current'
  return 'Paused'
}

export function managerSignalCanBecomeOpportunity(input: {
  signal_type: string
  source_payload?: Record<string, unknown> | null
  source_kind?: string | null
}) {
  if (input.source_kind === 'agency') return false
  if (input.source_payload?.actionable === false) return false
  if (input.source_payload?.lead_strength === 'relationship_signal') return false
  if (input.signal_type === 'venue_programming') return false
  return true
}
