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
    </div>
  )
}

export default function BookingSection({ bookingEmail }: Props) {
  const email = bookingEmail ?? CONTENT_DEFAULTS.booking_email
  return (
    <section id="booking" aria-label="Book DJ B.A.E." style={{
      background: 'var(--off-black)', borderTop: '1px solid var(--border)',
      position: 'relative',
    }}>
      <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
        <span className="section-label">Booking</span>
        <h2 className="section-heading" style={{ marginBottom: '18px' }}>Book DJ B.A.E.</h2>
        <p style={{
          margin: '0 0 28px',
          maxWidth: '620px',
          fontSize: '15px',
          lineHeight: 1.75,
          color: 'var(--muted)',
        }}>
          Share the date, setting, and what you need. The format can scale from a short set to a full night.
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px 32px',
          padding: '16px 0',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          marginBottom: '28px',
        }}>
          {[
            { label: 'Inquiry', desc: 'Send the event details.' },
            { label: 'Confirm', desc: 'We align on format and logistics.' },
            { label: 'Deposit', desc: 'The deposit secures the date.' },
          ].map(({ label, desc }) => (
            <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <strong style={{ fontSize: '13px', color: 'var(--white)', fontWeight: 500 }}>{label}</strong>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{desc}</span>
            </div>
          ))}
        </div>

        <div className="build-console">
          {/* Grid: copy panel left, packages right */}
          <div className="build-console-grid">
            <div className="build-console-copy">
              <h2 style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: 'clamp(22px, 4vw, 44px)', fontWeight: 600,
                color: 'var(--white)', lineHeight: 1.05, marginBottom: '16px',
              }}>
                Built around<br />
                <span style={{ color: 'var(--violet)' }}>your event.</span>
              </h2>
              <p className="build-console-body">
                Private events, clubs, weddings, and branded rooms. The set, timing, and setup can be shaped around the room and the crowd.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/book" className="btn-primary">Booking Inquiry</Link>
                <Link href="/portfolio" className="btn-ghost">View Portfolio</Link>
              </div>
              {email && (
                <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  Prefer email? <a href={`mailto:${email}`} className="inline-link" style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px' }}>Reach out directly</a>.
                </p>
              )}
            </div>

            <div className="build-console-mixer">
              <div className="build-console-fx-header">
                <span>Starting Points</span>
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

              <p style={{ marginTop: '18px', fontSize: '14px' }}>
                <Link href="/book" className="inline-link">View booking details</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
