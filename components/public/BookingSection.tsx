/**
 * BOOKING SECTION — Server Component
 * "Book with BAE" — DJ console surface, matching meet page's build-console aesthetic.
 * Topbar screen + copy panel + package modules inside the console grid.
 * Hover states via CSS classes — no JS event handlers.
 *
 * Accepts optional CMS override for booking email.
 * Falls back to CONTENT_DEFAULTS.booking_email if not set.
 */
import Link from 'next/link'
import { PACKAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { CONTENT_DEFAULTS } from '@/lib/content-schema'

interface Props {
  bookingEmail?: string
}

function PackageModule({
  price, hours, desc,
}: {
  price: number | null
  hours: number
  desc:  string
}) {
  return (
    <div className="build-console-module">
      <div className="build-console-module-top">
        <span className="build-console-module-category">
          {price === null ? `${hours}+ hrs` : `${hours} hr`}
        </span>
      </div>
      <div className="build-console-module-name">
        {price ? formatCurrency(price) : 'Custom'}
      </div>
      <div className="build-console-module-desc">{desc}</div>
      <div className="build-console-module-meter" aria-hidden="true">
        <span style={{ width: price === null ? '88%' : '65%' }} />
      </div>
    </div>
  )
}

export default function BookingSection({ bookingEmail }: Props) {
  const email = bookingEmail ?? CONTENT_DEFAULTS.booking_email
  const bookingSignals = [
    'Private events, clubs, weddings, branded rooms',
    'Clear inquiry to deposit flow',
    'Custom format available when the room calls for it',
  ]

  return (
    <section id="booking" aria-label="Book DJ B.A.E." style={{
      background: 'var(--off-black)', borderTop: '1px solid var(--border)',
      position: 'relative',
    }}>
      <div className="noise-overlay" aria-hidden="true" style={{ opacity: 0.02 }} />

      <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hardware-heading"><span className="section-label">Booking</span></div>
        <h2 className="section-heading" style={{ marginBottom: '28px' }}>Booking</h2>

        {/* 3-step process */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          marginBottom: '28px',
        }}>
          {[
            { step: '01', label: 'Inquiry',     desc: 'Submit your event details through the booking form.' },
            { step: '02', label: 'Follow-Up',   desc: 'We review and reach back within 24–48 hours.' },
            { step: '03', label: 'Locked In',   desc: 'Deposit secures the date. Details confirmed.' },
          ].map(({ step, label, desc }) => (
            <div key={step} style={{
              background: 'var(--off-black)',
              padding: '20px 18px',
              display: 'grid',
              gap: '6px',
            }}>
              <div style={{
                fontSize: '9px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--violet)',
              }}>
                {step}
              </div>
              <div style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: '13px',
                color: 'var(--white)',
              }}>
                {label}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>

        <div className="build-console">
          {/* Grid: copy panel left, packages right */}
          <div className="build-console-grid">
            <div
              className="build-console-copy"
              style={{ background: 'linear-gradient(180deg, rgba(155,93,229,0.08), rgba(18,18,22,0.96))' }}
            >
              <h2 style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: 'clamp(22px, 4vw, 44px)', fontWeight: 600,
                color: 'var(--white)', lineHeight: 1.05, marginBottom: '16px',
              }}>
                Book with<br />
                <span style={{ color: 'var(--violet)' }}>BAE</span>
              </h2>
              <p className="build-console-body">
                Short set, full night, or something custom — the format shapes
                around the room, the crowd, and the energy you want.
              </p>
              <div style={{ marginTop: '18px', display: 'grid', gap: '8px' }}>
                {bookingSignals.map((signal) => (
                  <div
                    key={signal}
                    style={{
                      fontSize: '12px',
                      lineHeight: 1.65,
                      color: 'rgba(250,248,243,0.76)',
                    }}
                  >
                    {signal}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/book" className="btn-primary">Start Booking →</Link>
                <Link href="/portfolio" className="btn-ghost">See Event Proof →</Link>
              </div>
              {email && (
                <p style={{ marginTop: '14px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  Prefer email? <a href={`mailto:${email}`} className="inline-link" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>Reach out directly</a>.
                </p>
              )}
            </div>

            <div className="build-console-mixer">
              <div className="build-console-fx-header">
                <span>Packages</span>
                <div className="build-console-mini-chips">
                  <span>Hourly</span>
                  <span>Custom</span>
                </div>
              </div>

              <div className="build-console-module-grid">
                {PACKAGES.map(pkg => (
                  <PackageModule
                    key={pkg.name}
                    price={pkg.price}
                    hours={pkg.hours}
                    desc={pkg.desc}
                  />
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <Link href="/book" className="btn-ghost" style={{ justifyContent: 'center' }}>
                  View All Options →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
