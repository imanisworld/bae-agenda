/**
 * BOOKING SECTION — Server Component
 * Static packages + CTA. Phase 3: wire to booking form.
 * Hover states via CSS classes — no JS event handlers.
 *
 * Accepts optional CMS override for booking email.
 * Falls back to CONTENT_DEFAULTS.booking_email if not set.
 */
import { PACKAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { CONTENT_DEFAULTS } from '@/lib/content-schema'

interface Props {
  bookingEmail?: string
}

function PackageCard({
  name, price, hours, desc, featured = false, bookingEmail,
}: {
  name:         string
  price:        number | null
  hours:        number
  desc:         string
  featured?:    boolean
  bookingEmail: string
}) {
  const subject = encodeURIComponent(`Booking Inquiry: ${name}`)
  const href    = bookingEmail
    ? `mailto:${bookingEmail}?subject=${subject}`
    : '/#booking'

  return (
    <div style={{
      padding: '32px',
      background: featured ? 'var(--violet-dim)' : 'transparent',
      border: `1px solid ${featured ? 'rgba(155,93,229,0.35)' : 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative',
    }}>
      {featured && (
        <span style={{
          position: 'absolute', top: '-1px', right: '24px',
          background: 'var(--violet)', color: 'var(--white)',
          fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase',
          padding: '4px 10px', fontWeight: 500,
        }}>
          Popular
        </span>
      )}

      <span style={{
        fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase',
        color: featured ? 'var(--violet)' : 'var(--muted)',
      }}>
        {hours} Hours
      </span>

      <h3 style={{
        fontFamily: 'Conthrax, sans-serif', fontSize: '18px', fontWeight: 600,
        color: 'var(--white)', letterSpacing: '0.04em',
      }}>
        {name}
      </h3>

      <div style={{
        fontFamily: 'Conthrax, sans-serif',
        fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 600,
        color: featured ? 'var(--violet)' : 'var(--white)', lineHeight: 1,
      }}>
        {price ? formatCurrency(price) : 'Custom'}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6, flex: 1, marginTop: '4px' }}>
        {desc}
      </p>

      {/* CSS class handles hover — .pkg-btn and .pkg-btn-featured in globals.css */}
      <a href={href} className={featured ? 'pkg-btn-featured' : 'pkg-btn'}>
        Book This Package
      </a>
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
        <div style={{ maxWidth: '640px', marginBottom: '64px' }}>
          <span className="section-label">Book The Bae</span>
          <h2 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(28px, 4.5vw, 56px)', fontWeight: 600,
            letterSpacing: '0.01em', color: 'var(--white)',
            lineHeight: 1.1, marginBottom: '20px',
          }}>
            Ready to Elevate<br />
            <span style={{ color: 'var(--violet)' }}>Your Event?</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300 }}>
            From birthday parties to corporate events, weddings to club nights —
            every set is built to be felt. Choose a package below or reach out
            for a custom quote.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px', marginBottom: '56px',
        }}>
          {PACKAGES.map((pkg, i) => (
            <PackageCard
              key={pkg.name}
              name={pkg.name}
              price={pkg.price}
              hours={pkg.hours}
              desc={pkg.desc}
              featured={i === 1}
              bookingEmail={email}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Primary CTA — opens email client with pre-filled subject */}
          <a
            href={email ? `mailto:${email}?subject=Booking%20Inquiry` : '/#booking'}
            className="btn-white"
          >
            Start Booking Process →
          </a>

          {email && (
            <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
              Questions?{' '}
              <a href={`mailto:${email}`} className="inline-link">
                {email}
              </a>
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
