import Link from 'next/link'
import { redirect } from 'next/navigation'
import { sendPortalCodeAction, verifyPortalCodeAction } from '@/app/actions/portal'
import { getPortalSessionClient } from '@/lib/portal-auth'

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function PortalVerifyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const client = await getPortalSessionClient()
  if (client) {
    redirect('/portal')
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const phone = getMessage(resolvedSearchParams?.phone) ?? ''
  const masked = getMessage(resolvedSearchParams?.masked)
  const errorMessage = getMessage(resolvedSearchParams?.error)
  const sent = getMessage(resolvedSearchParams?.sent)

  if (!phone) {
    redirect('/portal/login')
  }

  return (
    <section className="section-container" style={{ maxWidth: '720px', paddingTop: '104px', paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gap: '18px', border: '1px solid var(--border)', background: 'rgba(10,10,14,0.92)', padding: '28px' }}>
        <div style={{ display: 'grid', gap: '10px' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>Client Portal</span>
          <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(28px, 6vw, 44px)', lineHeight: 1.05 }}>
            Enter your 6-digit code
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.75, maxWidth: '34rem' }}>
            {sent
              ? `We sent a code to ${masked || 'your phone'}.`
              : 'Enter the code from your text message to open your portal.'}
          </p>
        </div>

        {errorMessage && (
          <div style={{ border: '1px solid rgba(232,93,117,0.28)', background: 'rgba(232,93,117,0.08)', color: '#fecdd3', padding: '14px 16px', fontSize: '13px', lineHeight: 1.6 }}>
            {errorMessage}
          </div>
        )}

        <form action={verifyPortalCodeAction} style={{ display: 'grid', gap: '16px' }}>
          <input type="hidden" name="phone" value={phone} />
          <label style={{ display: 'grid', gap: '8px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--eyebrow)' }}>
              Verification Code
            </span>
            <input
              type="text"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              spellCheck={false}
              placeholder="123456…"
              required
              style={{
                width: '100%',
                background: 'var(--off-black)',
                border: '1px solid var(--border)',
                color: 'var(--white)',
                padding: '14px 16px',
                minHeight: '56px',
                fontSize: '24px',
                letterSpacing: '0.24em',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </label>

          <button type="submit" className="btn-primary" style={{ justifySelf: 'start', minHeight: '48px' }}>
            Open Portal
          </button>
        </form>

        <form action={sendPortalCodeAction} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <input type="hidden" name="phone" value={phone} />
          <button type="submit" className="inline-link" style={{ background: 'none', border: 'none', padding: '10px 0', minHeight: '44px', cursor: 'pointer' }}>
            Send a new code
          </button>
          <Link href="/portal/login" className="inline-link" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>
            Use a different number
          </Link>
        </form>
      </div>
    </section>
  )
}
