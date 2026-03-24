import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { createRequestId, logError } from '@/lib/monitoring'

const schema = z.object({
  email: z.string().email().max(254),
  website: z.string().max(200).optional().or(z.literal('')),
  startedAt: z.string().max(30).optional().or(z.literal('')),
})

const SIGNUP_WINDOW_MS = 15 * 60 * 1000
const SIGNUP_LIMIT = 5
const MIN_SUBMIT_MS = 1200

export async function POST(request: Request) {
  const requestId = createRequestId()
  const clientIp = getClientIp(request.headers)
  const rateLimit = checkRateLimit(`notify-signup:${clientIp}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please wait a few minutes and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds), 'X-Request-Id': requestId },
      }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', requestId }, { status: 400, headers: { 'X-Request-Id': requestId } })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email', requestId }, { status: 422, headers: { 'X-Request-Id': requestId } })
  }

  const { email, website, startedAt } = parsed.data
  if (website?.trim()) {
    return NextResponse.json({ ok: true, requestId }, { status: 201, headers: { 'X-Request-Id': requestId } })
  }

  const startedAtMs = Number(startedAt)
  if (
    startedAt &&
    Number.isFinite(startedAtMs) &&
    startedAtMs > 0 &&
    Date.now() - startedAtMs < MIN_SUBMIT_MS
  ) {
    return NextResponse.json({ error: 'Submission blocked. Please try again.' }, { status: 400 })
  }

  const apiKey   = process.env.RESEND_API_KEY
  const fromAddr = process.env.MIXES_FROM_EMAIL ?? process.env.BOOKING_FROM_EMAIL
  const toAddr   = process.env.MIXES_NOTIFY_TO_EMAIL ?? process.env.BOOKING_ALERT_EMAIL ?? 'baebookings@proton.me'

  try {
    if (apiKey && fromAddr) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to:   toAddr,
          subject: 'New Mix Notify Signup',
          html: `<p><strong>${email}</strong> wants to be notified when new mixes drop.</p>`,
          reply_to: email,
        }),
      })
    }
  } catch (error) {
    logError('Notify signup email dispatch failed', error, { requestId, route: '/api/notify-signup' })
  }

  return NextResponse.json({ ok: true, requestId }, { headers: { 'X-Request-Id': requestId } })
}
