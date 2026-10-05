import { managerFollowUpUrgency } from '@/lib/manager-follow-up'

export type ManagerTodayItem = {
  id: string
  title: string
  organization: string | null
  status: string
  fit_score: number | null
  next_action: string | null
  next_action_at: string | null
  outreach_missing_items: string[] | null
}

export type ManagerTodayEntry = {
  item: ManagerTodayItem
  priority: number
  label: string
}

export function buildManagerTodayQueue(items: ManagerTodayItem[]) {
  return items
    .map((item): ManagerTodayEntry | null => {
      const urgency = managerFollowUpUrgency(item.next_action_at)
      const missing = item.outreach_missing_items?.length ?? 0

      if (urgency === 'overdue') {
        return { item, priority: 1, label: 'Follow-up overdue' }
      }

      if (urgency === 'due') {
        return { item, priority: 2, label: 'Follow up today' }
      }

      if (item.status === 'negotiating') {
        return { item, priority: 3, label: item.next_action ?? 'Continue negotiation' }
      }

      if (item.status === 'outreach_ready') {
        return { item, priority: 4, label: 'Outreach ready' }
      }

      if (missing > 0) {
        return {
          item,
          priority: 5,
          label: `Resolve ${missing} blocker${missing === 1 ? '' : 's'}`,
        }
      }

      if (['found', 'qualified', 'review'].includes(item.status)) {
        return { item, priority: 6, label: item.next_action ?? 'Review opportunity' }
      }

      return null
    })
    .filter((entry): entry is ManagerTodayEntry => Boolean(entry))
    .sort((a, b) => a.priority - b.priority || (b.item.fit_score ?? -1) - (a.item.fit_score ?? -1))
    .slice(0, 10)
}
