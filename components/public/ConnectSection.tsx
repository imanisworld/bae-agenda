/**
 * CONNECT SECTION — Server Component
 * "Stay Connected" — social links grid.
 * Hover via CSS class; no JS event handlers.
 */
import { SOCIALS } from '@/lib/constants'

export default function ConnectSection() {
  return (
    <section
      id="connect"
      aria-label="Stay Connected"
      style={{
        background: 'var(--off-black)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="section-container" style={{ textAlign: 'center' }}>

        <span className="section-label" style={{ justifyContent: 'center' }}>Socials</span>
        <h2 className="section-heading">Stay Connected</h2>

        <p style={{
          fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7,
          maxWidth: '480px', margin: '0 auto 56px',
        }}>
          Follow for mixes, event announcements, and behind the scenes.
        </p>

        {/* Social grid */}
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', gap: '16px',
        }}>
          {SOCIALS.map(({ label, url, icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`DJ B.A.E. on ${label}`}
              className="social-card"
            >
              <span
                aria-hidden="true"
                style={{ fontSize: '22px', lineHeight: 1, display: 'block', marginBottom: '10px' }}
              >
                {icon}
              </span>
              <span style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--white)',
              }}>
                {label}
              </span>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}
