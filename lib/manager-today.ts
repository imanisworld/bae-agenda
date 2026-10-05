import { managerFollowUpUrgency, managerTodayDate } from '@/lib/manager-follow-up'

export type ManagerTodayItem = {
  id: string
  title: string
  organization: string | null
  status: string
  fit_score: number | null
  next_action: string | null
  next_action_at: string | null
  outreach_missing_items: string[] | null
  event_date?: string | null
  application_deadline?: string | null
}

export type ManagerTodayEntry = {
  item: ManagerTodayItem
  priority: number
  label: string
  /** The date that drives this entry's urgency, if any (YYYY-MM-DD). */
  dueOn: string | null
}

export type ManagerTodayQueue = {
  entries: ManagerTodayEntry[]
  total: number
}

export const MANAGER_TODAY_LIMIT = 10

const FOLLOW_UP_STATUSES = ['applied', 'contacted', 'follow_up']
const PRE_OUTREACH_STATUSES = ['found', 'qualified', 'review', 'outreach_ready']
const REVIEW_STATUSES = ['found', 'qualified', 'review']
const CLOSED_STATUSES = ['booked', 'passed', 'lost']

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function classify(item: ManagerTodayItem, today: string, now: Date): Omit<ManagerTodayEntry, 'item'> | null {
  if (CLOSED_STATUSES.includes(item.status)) return null

  const isFollowUpStage = FOLLOW_UP_STATUSES.includes(item.status)
  const urgency = managerFollowUpUrgency(item.next_action_at, now)
  const missing = item.outreach_missing_items?.length ?? 0

  // 1–2. Dated actions that are overdue or due today. Follow-up stages get
  // follow-up wording; any other dated action keeps its own wording so a
  // review lead with a manual deadline is not mislabeled as a follow-up.
  if (urgency === 'overdue' || urgency === 'due') {
    const overdue = urgency === 'overdue'
    const label = isFollowUpStage
      ? overdue ? 'Follow-up overdue' : 'Follow up today'
      : `${overdue ? 'Overdue' : 'Due today'}: ${item.next_action ?? 'next action'}`
    return { priority: overdue ? 1 : 2, label, dueOn: item.next_action_at }
  }

  // 3. Live conversations: negotiations, plus contacted/applied leads with no
  // follow-up date (e.g. after a response was logged), which would otherwise
  // drop out of every queue.
  if (item.status === 'negotiating') {
    return { priority: 3, label: item.next_action ?? 'Continue negotiation', dueOn: item.next_action_at }
  }

  if (isFollowUpStage && !item.next_action_at) {
    return { priority: 3, label: 'No follow-up scheduled — set next step', dueOn: null }
  }

  if (PRE_OUTREACH_STATUSES.includes(item.status)) {
    // A deliberately scheduled pre-outreach action should stay out of Today
    // until its date arrives. This supports annual/seasonal warm rebook leads
    // without cluttering the daily queue months in advance.
    if (item.next_action_at && item.next_action_at > today) {
      return null
    }

    // A pre-outreach lead whose date or deadline already passed is stale.
    const passed = [item.application_deadline, item.event_date].find(
      (date): date is string => Boolean(date && date < today)
    )
    if (passed) {
      const which = passed === item.application_deadline ? 'Deadline' : 'Event date'
      return { priority: 5, label: `${which} passed — pass or update`, dueOn: passed }
    }

    const dueOn = item.application_deadline ?? item.event_date ?? null

    // 4. Ready to send (only when nothing is missing).
    if (item.status === 'outreach_ready' && missing === 0) {
      return { priority: 4, label: 'Outreach ready', dueOn }
    }

    // 5. Blocked by missing information/assets.
    if (missing > 0) {
      return { priority: 5, label: `Resolve ${plural(missing, 'blocker')}`, dueOn }
    }

    // 6. New/review leads needing a decision.
    if (REVIEW_STATUSES.includes(item.status)) {
      return { priority: 6, label: item.next_action ?? 'Review opportunity', dueOn }
    }
  }

  return null
}

export function buildManagerTodayQueue(
  items: ManagerTodayItem[],
  { now = new Date(), limit = MANAGER_TODAY_LIMIT }: { now?: Date; limit?: number } = {}
): ManagerTodayQueue {
  const today = managerTodayDate(now)
  const all = items
    .map((item) => {
      const entry = classify(item, today, now)
      return entry ? { item, ...entry } : null
    })
    .filter((entry): entry is ManagerTodayEntry => Boolean(entry))
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        // Soonest date first; undated entries after dated ones.
        (a.dueOn ?? '9999').localeCompare(b.dueOn ?? '9999') ||
        (b.item.fit_score ?? -1) - (a.item.fit_score ?? -1)
    )

  return { entries: all.slice(0, limit), total: all.length }
}
