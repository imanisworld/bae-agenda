import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError, logEvent } from '@/lib/monitoring'

export const runtime = 'nodejs'

type ResendWebhookEvent = {
  type: string
  created_at?: string
  data: unknown
}

const TRACKED_EMAIL_EVENTS = new Set([
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.bounced',
  'email.complained',
  'email.failed',
  'email.suppressed',
])

function firstRecipient(value: unknown) {
  if (!Array.isArray(value)) return null
  const recipient = value.find((item): item is string => typeof item === 'string' && item.length > 0)
  return recipient ?? null
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  if (!apiKey || !webhookSecret) {
    logEvent('error', 'resend_webhook_missing_config', {
      apiKeyConfigured: Boolean(apiKey),
      webhookSecretConfigured: Boolean(webhookSecret),
    })
    return NextResponse.json({ error: 'Webhook configuration missing.' }, { status: 500 })
  }

  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signature = request.headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: 'Missing webhook signature headers.' }, { status: 400 })
  }

  const payload = await request.text()

  let event: ResendWebhookEvent
  try {
    const resend = new Resend(apiKey)
    event = await resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    })
  } catch (error) {
    logError('resend_webhook_verification_failed', error, { eventId: id })
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  if (!TRACKED_EMAIL_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true })
  }

  const data = event.data as Record<string, unknown>
  const emailId = stringValue(data.email_id)

  if (!emailId) {
    logEvent('error', 'resend_webhook_missing_email_id', {
      eventId: id,
      eventType: event.type,
    })
    return NextResponse.json({ error: 'Missing email id.' }, { status: 400 })
  }

  const occurredAt = stringValue(event.created_at) ?? new Date().toISOString()
  const admin = createAdminClient()
  const { error } = await admin
    .from('email_delivery_events')
    .upsert(
      {
        event_id: id,
        email_id: emailId,
        event_type: event.type,
        recipient: firstRecipient(data.to),
        subject: stringValue(data.subject),
        occurred_at: occurredAt,
        payload: event,
      },
      {
        onConflict: 'event_id',
        ignoreDuplicates: true,
      }
    )

  if (error) {
    logEvent('error', 'resend_webhook_store_failed', {
      eventId: id,
      eventType: event.type,
      emailId,
      detail: error.message,
    })
    return NextResponse.json({ error: 'Unable to store webhook.' }, { status: 500 })
  }

  logEvent('info', 'resend_delivery_event_recorded', {
    eventId: id,
    eventType: event.type,
    emailId,
  })

  return NextResponse.json({ received: true })
}
