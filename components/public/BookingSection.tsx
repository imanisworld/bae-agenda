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
  name, price, hours, desc,
}: {
  name:  string
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

  return (
    <section id="booking" aria-label="Book DJ B.A.E." style={{
      background: 'var(--off-black)', borderTop: '1px solid var(--border)',
      position: 'relative',
    }}>
      <div className="noise-overlay" aria-hidden="true" style={{ opacity: 0.02 }} />

      <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hardware-heading"><span className="section-label">Booking</span></div>

        <div className="build-console">
          {/* Topbar: screen + chips + dial */}
          <div className="build-console-topbar">
            <div className="build-console-screen">
              <div className="build-console-screen-label">Booking Console</div>
              <div className="build-console-screen-value">Book with BAE</div>
              <div className="build-console-screen-lines">
                <span><strong>Rate</strong> $300/hour — hourly or custom packages</span>
                <span><strong>Formats</strong> Club nights, private events, weddings, rooftops</span>
                <span><strong>Range</strong> Open-format — hip-hop, R&amp;B, house, Afrobeats &amp; more</span>
              </div>
            </div>

            <div className="build-console-chip-row" aria-hidden="true">
              <span>Hourly</span>
              <span>Custom</span>
              <span>Travel</span>
            </div>

            <div className="build-console-dial-cluster" aria-hidden="true">
              <span className="build-console-dial" />
              <span className="build-console-dial-label">Booking</span>
            </div>
          </div>

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
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/book" className="btn-primary">Start Booking →</Link>
                {email && (
                  <a href={`mailto:${email}`} className="btn-ghost">Email Us</a>
                )}
              </div>
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
                    name={pkg.name}
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
