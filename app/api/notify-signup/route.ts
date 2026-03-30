import { NextResponse } from 'next/server'
import { z } from 'zod'
import { limitNotifySignup } from '@/lib/ratelimit'

const schema = z.object({
  email: z.string().email().max(254),
  company: z.string().max(200).optional().default(''),
})

const ALLOWED_ORIGINS = new Set([
  'https://thebaeagenda.com',
  'https://www.thebaeagenda.com',
])

function isAllowedOrigin(origin: string) {
  if (!origin) return true

  if (ALLOWED_ORIGINS.has(origin)) {
    return true
  }

  try {
    const url = new URL(origin)
    return ['localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rateLimit = await limitNotifySignup(request.headers)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many signup attempts. Please wait a few minutes and try again.',
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter) },
      }
    )
  }

  const origin = request.headers.get('origin') ?? ''
  const contentType = request.headers.get('content-type') ?? ''

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 422 })
  }

  const { email, company } = parsed.data

  if (company.trim() !== '') {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const fromAddr = process.env.FROM_EMAIL
  const toAddr = process.env.ALERT_EMAIL ?? 'baebookings@proton.me'

  if (!apiKey || !fromAddr) {
    console.error('Notify signup misconfigured: missing env vars')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddr,
        to: toAddr,
        subject: 'New Mix Notify Signup',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2>New Notify Signup</h2>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          </div>
        `,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend error:', resendResponse.status, errorText)
      return NextResponse.json({ error: 'Email failed to send' }, { status: 502 })
    }
  } catch (error) {
    console.error('Notify signup route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
