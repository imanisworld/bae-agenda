import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email().max(254),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 422 })
  }

  const { email } = parsed.data

  const apiKey   = process.env.RESEND_API_KEY
  const fromAddr = process.env.BOOKING_FROM_EMAIL
  const toAddr   = process.env.BOOKING_ALERT_EMAIL ?? 'baebookings@proton.me'

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
      }),
    })
  }

  return NextResponse.json({ ok: true })
}
