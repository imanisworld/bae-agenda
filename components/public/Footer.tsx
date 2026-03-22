/**
 * PUBLIC FOOTER — Server Component
 * Brand, nav, socials, copyright.
 * Hover states via CSS classes — no JS event handlers.
 */
import Link from 'next/link'
import { PUBLIC_NAV } from '@/lib/constants'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer aria-label="Site footer" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>

      <div className="section-container" style={{ paddingTop: '42px', paddingBottom: '34px' }}>
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand" style={{ maxWidth: '280px' }}>
            <Link href="/" className="hover-link" style={{ display: 'inline-block', marginBottom: '8px' }}>
              <span style={{
                fontFamily: 'Conthrax, sans-serif', fontSize: '13px',
                fontWeight: 600, letterSpacing: '0.18em', color: 'var(--white)',
              }}>
                DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
              </span>
            </Link>
            <p style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6, fontWeight: 300 }}>
              Chicago&apos;s DJ, curator, and experience architect. Every set is built to be felt.
            </p>
          </div>

          {/* Nav */}
          <div>
            <p style={{ fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--eyebrow)', marginBottom: '20px' }}>
              Navigate
            </p>
            <nav aria-label="Footer navigation">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PUBLIC_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover-link" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

        </div>
      </div>

      {/* Copyright bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 32px' }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <p style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
            © {CURRENT_YEAR} DJ B.A.E. · The Bae Agenda. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
