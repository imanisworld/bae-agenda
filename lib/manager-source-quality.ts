export type ManagerSourceSignalStatus = 'new' | 'relevant' | 'ignored' | 'converted'

export type ManagerSourceSignalSummary = {
  total: number
  useful: number
  ignored: number
  converted: number
  yieldPercent: number | null
  health: 'no_data' | 'productive' | 'mixed' | 'noisy'
}

export function summarizeManagerSourceSignals(
  statuses: ManagerSourceSignalStatus[]
): ManagerSourceSignalSummary {
  const total = statuses.length
  const ignored = statuses.filter((status) => status === 'ignored').length
  const converted = statuses.filter((status) => status === 'converted').length
  const useful = statuses.filter((status) => status !== 'ignored').length
  const yieldPercent = total === 0 ? null : Math.round((useful / total) * 100)

  let health: ManagerSourceSignalSummary['health'] = 'mixed'
  if (total === 0) {
    health = 'no_data'
  } else if (converted > 0 || (total >= 2 && useful / total >= 0.67)) {
    health = 'productive'
  } else if (total >= 3 && ignored / total >= 0.67) {
    health = 'noisy'
  }

  return { total, useful, ignored, converted, yieldPercent, health }
}

export function managerSourceHealthLabel(health: ManagerSourceSignalSummary['health']) {
  if (health === 'productive') return 'Productive'
  if (health === 'noisy') return 'Noisy'
  if (health === 'mixed') return 'Mixed'
  return 'No data'
}
