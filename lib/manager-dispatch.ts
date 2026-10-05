import type { ManagerOutreachChannel } from '@/lib/manager-outreach'

export const MANAGER_DEFAULT_FOLLOW_UP_DAYS = 5

export function managerDispatchStatus(channel: ManagerOutreachChannel) {
  return channel === 'application' ? 'applied' as const : 'contacted' as const
}

export function managerDispatchActivityType(channel: ManagerOutreachChannel) {
  return channel === 'application' ? 'application' as const : 'contact' as const
}

export function managerDispatchActionLabel(channel: ManagerOutreachChannel) {
  if (channel === 'email') return 'Send Email'
  if (channel === 'instagram_dm') return 'Mark DM Sent'
  if (channel === 'application') return 'Mark Application Submitted'
  if (channel === 'web_form') return 'Mark Web Outreach Sent'
  if (channel === 'phone') return 'Mark Call Completed'
  return 'Mark Outreach Sent'
}

export function managerDispatchSuccessLabel(channel: ManagerOutreachChannel) {
  if (channel === 'email') return 'Email sent'
  if (channel === 'instagram_dm') return 'Instagram DM recorded'
  if (channel === 'application') return 'Application recorded'
  if (channel === 'web_form') return 'Web outreach recorded'
  if (channel === 'phone') return 'Phone outreach recorded'
  return 'Outreach recorded'
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

export function defaultManagerFollowUpDate(
  now = new Date(),
  days = MANAGER_DEFAULT_FOLLOW_UP_DAYS
) {
  const local = localDateParts(now, 'America/Indiana/Indianapolis')
  const date = new Date(Date.UTC(local.year, local.month - 1, local.day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderManagerOutreachHtml(draft: string) {
  const body = escapeHtml(draft).replace(/\n/g, '<br />')

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;color:#111111;">
    <div style="max-width:640px;margin:0 auto;padding:28px 20px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">
      ${body}
    </div>
  </body>
</html>`
}

/**
 * The message to keep on record for a dispatch. Email sends the saved draft,
 * so that is what was sent. For DMs, forms, applications, and calls the user
 * sends outside Manager and can paste/edit the actual text before recording.
 */
export function managerRecordedMessage(
  channel: ManagerOutreachChannel,
  savedDraft: string,
  sentMessage: string | null | undefined
) {
  const sent = sentMessage?.replace(/\r\n/g, '\n').trim()
  if (channel === 'email' || !sent) {
    return { body: savedDraft, source: 'saved_draft' as const, edited: false }
  }
  return { body: sent, source: 'as_sent' as const, edited: sent !== savedDraft.trim() }
}
