import Link from 'next/link'
import { redirect } from 'next/navigation'
import { sendPortalCodeAction } from '@/app/actions/portal'
import { getPortalSessionClient } from '@/lib/portal-auth'

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const client = await getPortalSessionClient()
  if (client) {
    redirect('/portal')
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const errorMessage = getMessage(resolvedSearchParams?.error)

  return (
    <section className="section-container" style={{ maxWidth: '720px', paddingTop: '104px', paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gap: '18px', border: '1px solid var(--border)', background: 'rgba(10,10,14,0.92)', padding: '28px' }}>
        <div style={{ display: 'grid', gap: '10px' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>Client Portal</span>
          <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(28px, 6vw, 44px)', lineHeight: 1.05 }}>
            Sign in with your phone number
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.75, maxWidth: '34rem' }}>
            You&apos;ll get a one-time code by text so you can check your booking details without creating a password.
          </p>
        </div>

        {errorMessage && (
          <div style={{ border: '1px solid rgba(232,93,117,0.28)', background: 'rgba(232,93,117,0.08)', color: '#fecdd3', padding: '14px 16px', fontSize: '13px', lineHeight: 1.6 }}>
            {errorMessage}
          </div>
        )}

        <form action={sendPortalCodeAction} style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '8px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--eyebrow)' }}>
              Mobile Number
            </span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-5555…"
              required
              style={{
                width: '100%',
                background: 'var(--off-black)',
                border: '1px solid var(--border)',
                color: 'var(--white)',
                padding: '14px 16px',
                minHeight: '48px',
                fontSize: '16px',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </label>

          <button type="submit" className="btn-primary" style={{ justifySelf: 'start', minHeight: '48px' }}>
            Text Me A Code
          </button>
        </form>

        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.7 }}>
          If that number matches a booking, a code will be sent. Need help instead?{' '}
          <Link href="/book#contact" className="inline-link">Contact me</Link>.
        </p>
      </div>
    </section>
  )
}
