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

function isAllowedOrigin(origin: string, requestHost: string) {
  if (!origin) return true

  if (ALLOWED_ORIGINS.has(origin)) {
    return true
  }

  try {
    const url = new URL(origin)
    if (['localhost', '127.0.0.1'].includes(url.hostname)) {
      return true
    }

    return Boolean(requestHost) && url.host === requestHost
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
  const requestHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  const contentType = request.headers.get('content-type') ?? ''

  if (!isAllowedOrigin(origin, requestHost)) {
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
  const fromAddr = process.env.BOOKING_FROM_EMAIL
  const toAddr = process.env.BOOKING_ALERT_EMAIL ?? 'baebookings@proton.me'

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
          <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html dir="ltr" lang="en">
            <head>
              <meta content="width=device-width" name="viewport" />
              <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
              <meta content="IE=edge" http-equiv="X-UA-Compatible" />
              <meta name="x-apple-disable-message-reformatting" />
              <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
              <title>The Bae Agenda</title>
            </head>
            <body style="margin:0;padding:0;background-color:#0b0b10;">
              <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center" style="background-color:#0b0b10;margin:0;padding:24px 0;width:100%;">
                <tbody>
                  <tr>
                    <td align="center">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5f5f7;">
                        <tbody>
                          <tr>
                            <td style="padding:0 20px 16px 20px;" align="center">
                              <div style="display:inline-block;font-size:24px;font-weight:800;letter-spacing:0.5px;color:#ffffff;">
                                The Bae Agenda
                              </div>
                              <div style="margin-top:8px;font-size:13px;line-height:20px;color:#a1a1aa;">
                                New notify signup
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 20px;">
                              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#14141c;border:1px solid #27272f;border-radius:18px;">
                                <tbody>
                                  <tr>
                                    <td style="padding:32px 28px 24px 28px;">
                                      <div style="font-size:22px;font-weight:700;line-height:30px;color:#ffffff;margin:0 0 16px 0;">
                                        New notify signup
                                      </div>
                                      <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#e4e4e7;">
                                        Someone signed up to be notified when a new mix drops.
                                      </p>
                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;background-color:#101017;border:1px solid #27272f;border-radius:14px;">
                                        <tbody>
                                          <tr>
                                            <td style="padding:18px 18px 18px 18px;">
                                              <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px;">Email</div>
                                              <div style="font-size:16px;color:#ffffff;font-weight:600;">${escapeHtml(email)}</div>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      <p style="margin:0;font-size:13px;line-height:22px;color:#a1a1aa;">
                                        This alert was generated automatically.
                                      </p>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:18px 20px 0 20px;text-align:center;font-size:12px;line-height:20px;color:#71717a;">
                              © 2026 The Bae Agenda<br />
                              thebaeagenda.com
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </body>
          </html>
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
