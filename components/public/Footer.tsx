/**
 * PUBLIC FOOTER — Server Component
 * Brand, nav, socials, copyright.
 * Hover states via CSS classes — no JS event handlers.
 */
import Link from 'next/link'
import { PUBLIC_NAV, SOCIALS } from '@/lib/constants'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer aria-label="Site footer" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>

      {/* Main content */}
      <div className="section-container" style={{ paddingTop: '72px', paddingBottom: '72px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '64px', alignItems: 'start',
        }}>

          {/* Brand */}
          <div style={{ maxWidth: '300px' }}>
            <Link href="/" className="hover-link" style={{ display: 'inline-block', marginBottom: '12px' }}>
              <span style={{
                fontFamily: 'Conthrax, sans-serif', fontSize: '14px',
                fontWeight: 600, letterSpacing: '0.18em', color: 'var(--white)',
              }}>
                DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
              </span>
            </Link>
            <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300 }}>
              Chicago's DJ, curator, and experience architect. Every set is built to be felt.
            </p>
          </div>

          {/* Nav */}
          <div>
            <p style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
              Navigate
            </p>
            <nav aria-label="Footer navigation">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {PUBLIC_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover-link" style={{ fontSize: '12px', letterSpacing: '0.06em' }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Socials */}
          <div>
            <p style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
              Connect
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.url} target="_blank" rel="noopener noreferrer"
                    aria-label={social.label}
                    className="hover-link"
                    style={{ fontSize: '12px', letterSpacing: '0.06em' }}
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 64px' }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <p style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
            © {CURRENT_YEAR} DJ B.A.E. · The Bae Agenda. All rights reserved.
          </p>
          {/* Admin link — barely visible, .admin-link class in globals.css */}
          <Link href="/admin/dashboard" className="admin-link">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
