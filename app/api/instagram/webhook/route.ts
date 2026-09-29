import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { logEvent } from '@/lib/monitoring'

export const runtime = 'nodejs'

type InstagramWebhookPayload = {
  object?: string
  entry?: Array<{
    id?: string
    time?: number
    changes?: Array<{ field?: string }>
    messaging?: unknown[]
  }>
}

// Meta checks the callback URL once when the webhook is saved: it sends the
// verify token we typed into the dashboard and expects the challenge back.
export async function GET(request: NextRequest) {
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
  if (!verifyToken) {
    logEvent('error', 'instagram_webhook_missing_config', { verifyTokenConfigured: false })
    return NextResponse.json({ error: 'Webhook configuration missing.' }, { status: 500 })
  }

  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode !== 'subscribe' || !token || !challenge || !safeEqual(token, verifyToken)) {
    return NextResponse.json({ error: 'Verification failed.' }, { status: 403 })
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { 'content-type': 'text/plain' },
  })
}

// Event notifications are signed with the app secret (X-Hub-Signature-256).
export async function POST(request: NextRequest) {
  const appSecret = process.env.INSTAGRAM_APP_SECRET
  if (!appSecret) {
    logEvent('error', 'instagram_webhook_missing_config', { appSecretConfigured: false })
    return NextResponse.json({ error: 'Webhook configuration missing.' }, { status: 500 })
  }

  const signature = request.headers.get('x-hub-signature-256')
  if (!signature?.startsWith('sha256=')) {
    return NextResponse.json({ error: 'Missing webhook signature.' }, { status: 400 })
  }

  const payload = await request.text()
  const expected = `sha256=${createHmac('sha256', appSecret).update(payload).digest('hex')}`
  if (!safeEqual(signature, expected)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  let event: InstagramWebhookPayload
  try {
    event = JSON.parse(payload) as InstagramWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const entries = event.entry ?? []
  logEvent('info', 'instagram_webhook_received', {
    object: event.object ?? null,
    entries: entries.length,
    fields: [...new Set(entries.flatMap((entry) => (entry.changes ?? []).map((change) => change.field ?? 'unknown')))],
    messaging: entries.some((entry) => Array.isArray(entry.messaging) && entry.messaging.length > 0),
  })

  return NextResponse.json({ received: true })
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
