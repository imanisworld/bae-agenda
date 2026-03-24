/**
 * PUBLIC FOOTER — Server Component
 * Brand · Nav · Socials + bottom copyright bar.
 */
import Link from 'next/link'
import { SOCIALS } from '@/lib/constants'

const CURRENT_YEAR = new Date().getFullYear()

const NAV_LINKS = [
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Book',      href: '/book'      },
  { label: 'Built',     href: '/built'     },
]

const FOOTER_SOCIALS = SOCIALS.filter(s =>
  ['Instagram', 'TikTok', 'SoundCloud', 'YouTube'].includes(s.label)
)

export default function Footer() {
  return (
    <footer aria-label="Site footer" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <style>{`
        @media (max-width: 680px) {
          .footer-body {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .footer-brand { align-items: center !important; }
          .footer-body nav ul { justify-content: center !important; }
          .footer-socials { justify-content: center !important; }
        }
      `}</style>

      {/* Main: brand | nav | socials */}
      <div className="footer-body" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 72px)',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '32px',
      }}>

        {/* Brand */}
        <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '14px', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--white)' }}>
              DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
            </span>
          </Link>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55 }}>
            Chicago&apos;s DJ, curator, and experience architect.
          </p>
        </div>

        {/* Nav */}
        <nav aria-label="Footer navigation">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Socials */}
        <div className="footer-socials" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
          {FOOTER_SOCIALS.map(({ label, url, icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`DJ B.A.E. on ${label}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                border: '1px solid var(--border)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--muted)',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              {icon}
            </a>
          ))}
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '14px clamp(24px, 5vw, 72px)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <p style={{ margin: 0, fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
          © {CURRENT_YEAR} DJ B.A.E. · The Bae Agenda. All rights reserved.
        </p>
        <Link href="/privacy" className="inline-link" style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Privacy
        </Link>
      </div>

    </footer>
  )
}
