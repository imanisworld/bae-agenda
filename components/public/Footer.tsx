/**
 * PUBLIC FOOTER — Server Component
 * Brand blurb + copyright. Nav links live in the top nav bar.
 */
import Link from 'next/link'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer aria-label="Site footer" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '28px clamp(24px, 5vw, 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>

        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'Conthrax, sans-serif', fontSize: '13px',
            fontWeight: 600, letterSpacing: '0.18em', color: 'var(--white)',
          }}>
            DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
          </span>
        </Link>

        <p style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
          © {CURRENT_YEAR} DJ B.A.E. · The Bae Agenda. All rights reserved.
        </p>

        <Link href="/privacy" className="inline-link" style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Privacy
        </Link>

      </div>
    </footer>
  )
}
