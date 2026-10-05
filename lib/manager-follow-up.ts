import type { ManagerOutreachChannel } from '@/lib/manager-outreach'

export const MANAGER_SECOND_FOLLOW_UP_DAYS = 7

type FollowUpOpportunity = {
  title?: string | null
  organization?: string | null
  contact_name?: string | null
  outreach_channel?: ManagerOutreachChannel | null
  outreach_subject?: string | null
  outreach_draft?: string | null
  status?: string | null
}

function localDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  )

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  }
}

export function managerTodayDate(now = new Date()) {
  const local = localDateParts(now, 'America/Indiana/Indianapolis')
  return [
    String(local.year).padStart(4, '0'),
    String(local.month).padStart(2, '0'),
    String(local.day).padStart(2, '0'),
  ].join('-')
}

export function defaultManagerSecondFollowUpDate(
  now = new Date(),
  days = MANAGER_SECOND_FOLLOW_UP_DAYS
) {
  const local = localDateParts(now, 'America/Indiana/Indianapolis')
  const date = new Date(Date.UTC(local.year, local.month - 1, local.day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function managerFollowUpUrgency(
  followUpDate: string | null | undefined,
  now = new Date()
) {
  if (!followUpDate) return 'none' as const
  const today = managerTodayDate(now)
  if (followUpDate < today) return 'overdue' as const
  if (followUpDate === today) return 'due' as const
  return 'upcoming' as const
}

function firstName(value: string | null | undefined) {
  return value?.trim().split(/\s+/)[0] ?? ''
}

export function buildManagerFollowUpDraft(opportunity: FollowUpOpportunity) {
  const contact = firstName(opportunity.contact_name)
  const greeting = contact
    ? `Hi ${contact},`
    : opportunity.organization
      ? `Hi ${opportunity.organization} team,`
      : 'Hi,'

  const title = opportunity.title?.trim() || 'the DJ opportunity'
  const isApplication = opportunity.outreach_channel === 'application' || opportunity.status === 'applied'

  const body = isApplication
    ? [
        greeting,
        '',
        `I wanted to follow up on my application for ${title}.`,
        `I'm still very interested and would be happy to send any additional mixes, availability, or event details that would be helpful.`,
        '',
        'Thank you for your time and consideration.',
        '',
        'DJ B.A.E.',
      ]
    : [
        greeting,
        '',
        `Following up on my note about ${title}.`,
        `I'm still interested in connecting if you're booking DJs for upcoming dates. I'm happy to send availability or any additional material that would be useful.`,
        '',
        'Thanks,',
        'DJ B.A.E.',
      ]

  return body.join('\n')
}

export function managerFollowUpSubject(opportunity: FollowUpOpportunity) {
  const subject = opportunity.outreach_subject?.trim()
  if (!subject) return null
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`
}

export function managerFollowUpActionLabel(channel: ManagerOutreachChannel | null | undefined) {
  if (channel === 'email') return 'Send Follow-up Email'
  if (channel === 'instagram_dm') return 'Mark Follow-up DM Sent'
  if (channel === 'application') return 'Mark Application Follow-up Sent'
  if (channel === 'web_form') return 'Mark Web Follow-up Sent'
  if (channel === 'phone') return 'Mark Follow-up Call Completed'
  return 'Mark Follow-up Sent'
}
