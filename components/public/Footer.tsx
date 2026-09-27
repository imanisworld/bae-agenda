/**
 * PUBLIC FOOTER — Server Component
 * Brand · navigation + bottom copyright bar.
 */
import Link from 'next/link'

const CURRENT_YEAR = new Date().getFullYear()

const NAV_LINKS = [
  { label: 'Events',    href: '/events'        },
  { label: 'Lab',       href: '/lab'           },
  { label: 'Portfolio', href: '/portfolio'     },
  { label: 'Meet',      href: '/meet'          },
  { label: 'Book',      href: '/book'          },
  { label: 'Contact',   href: '/book#contact'  },
  { label: 'Built',     href: '/built'         },
  { label: 'Press Kit', href: '/press-kit'     },
]

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
        }
      `}</style>

      {/* Main: brand | nav */}
      <div className="footer-body" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(40px, 5vw, 64px) max(24px, calc(var(--safe-right) + 20px)) clamp(28px, 4vw, 40px) max(24px, calc(var(--safe-left) + 20px))',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
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
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.55 }}>
            Selector. Genre Bender. Sound Architect.
          </p>
        </div>

        {/* Nav */}
        <nav aria-label="Footer navigation">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', fontFamily: 'DM Sans, sans-serif', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>


      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '14px max(24px, calc(var(--safe-right) + 20px)) calc(14px + var(--safe-bottom)) max(24px, calc(var(--safe-left) + 20px))',
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
        <Link href="/privacy" className="inline-link" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Privacy
        </Link>
      </div>

    </footer>
  )
}
