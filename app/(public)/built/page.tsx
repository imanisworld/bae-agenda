import type { Metadata } from 'next'
import { getContentMap } from '@/lib/db/content'
import BuiltSection from '@/components/public/BuiltSection'
import BuildPads from '@/components/public/BuildPads'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Built | Custom Web Development for Artists & Brands',
  alternates: {
    canonical: '/built',
  },
  description:
    'Custom websites and booking platforms for DJs, artists, promoters, and creative businesses.',
  openGraph: {
    title: 'Built from Scratch — DJ B.A.E.',
    description:
      'Custom sites for artists and brands, including booking flows, admin tools, and content management.',
  },
}

const CONTENT_KEYS = ['about_quote'] as const
const WEB_INQUIRY_EMAIL = 'imanicru@pm.me'

function statCard(label: string, value: string, sub: string) {
  return (
    <div className="build-console-module">
      <div style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(24px, 3vw, 34px)', color: 'var(--white)', marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
        {sub}
      </div>
    </div>
  )
}

const TIERS = [
  {
    name: 'Starter',
    price: '$3,000 – $7,999',
    tag: 'Brand Presence',
    items: [
      'Public-facing site only',
      'Home, about, booking form, connect',
      'Mobile responsive across all screens',
      'Deployed to Vercel with custom domain',
      'No admin panel',
    ],
  },
  {
    name: 'Standard',
    price: '$8,000 – $11,999',
    tag: 'Full Platform',
    items: [
      'Everything in Starter',
      'Full admin panel — bookings, events, content',
      'Supabase backend with auth and RLS',
      'Booking workflow from inquiry to client record',
      '2 rounds of revisions',
    ],
  },
  {
    name: 'Custom',
    price: '$12,000+',
    tag: 'Scope It',
    items: [
      'Everything in Standard',
      'Custom features scoped to your business',
      'Press kit, portfolio, payment integration',
      'Anything else you need',
      'Ongoing retainer available after launch',
    ],
  },
]

export default async function BuiltPage() {
  const content = await getContentMap([...CONTENT_KEYS])

  return (
    <div style={{ background: 'var(--black)', paddingTop: 'calc(var(--nav-height) + var(--safe-top))' }}>
      <div className="section-container" style={{ display: 'grid', gap: '56px', paddingTop: 0, paddingBottom: '56px' }}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="built-page-hero" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)', gap: '32px', alignItems: 'center' }}>
          <div className="built-page-hero-copy">
            <div className="hardware-heading">
              <span className="section-label">Built</span>
            </div>
            <h1 style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(34px, 5.2vw, 64px)',
              lineHeight: 0.95,
              color: 'var(--white)',
              margin: '0 0 20px',
            }}>
              Built from<br />
              <span style={{ color: 'var(--amber)' }}>Scratch.</span>
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '8px' }}>
              Custom websites and booking systems for artists, DJs, promoters, and creative businesses that need more than a template.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--amber)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '28px', fontWeight: 500 }}>
              That can mean a public site, booking flow, admin tools, content management, or all of it together.
            </p>
            <div className="built-page-hero-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href={`mailto:${WEB_INQUIRY_EMAIL}?subject=Web Build Inquiry`} className="btn-primary">
                Project Inquiry
              </a>
            </div>
          </div>

        </section>

        {/* ── Stats ────────────────────────────────────────────── */}
        <section
          className="build-console-module-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}
        >
          {statCard('Typical Timeline', '~3 Months', 'Timing varies with scope and content readiness.')}
          {statCard('Core Layers', '4', 'Public site, admin tools, content management, and booking flow.')}
          {statCard('Ownership', 'Your Code', 'Source, content, and deployment stay under your control.')}
        </section>

        {/* ── What Was Built ───────────────────────────────────── */}
        <section
          className="build-console-mixer"
          style={{ padding: '26px', display: 'grid', gap: '16px' }}
        >
          <div className="build-console-fx-header">
            <span>What This Site Includes</span>
          </div>
          <BuildPads />
        </section>

        {/* ── What You Get — Pricing Tiers ─────────────────────── */}
        <section>
          <span className="section-label" style={{ display: 'block', marginBottom: '8px' }}>
            What You Get
          </span>
          <h2 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(22px, 3.5vw, 40px)',
            color: 'var(--white)',
            lineHeight: 1.1,
            margin: '0 0 12px',
          }}>
            Built for DJs, Artists,<br />
            <span style={{ color: 'var(--amber)' }}>Promoters & Venues.</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '32px' }}>
            The site should fit the business—not the other way around. Hosting and third-party services may have their own costs.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
            marginBottom: '20px',
          }}>
            {TIERS.map(({ name, price, tag, items }) => (
              <div key={name} style={{
                background: 'var(--off-black)',
                padding: '28px 24px',
                display: 'grid',
                gap: '16px',
              }}>
                <div>
                  <div style={{
                    fontSize: '10px',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    marginBottom: '6px',
                  }}>
                    {tag}
                  </div>
                  <div style={{
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(18px, 2.5vw, 24px)',
                    color: 'var(--white)',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}>
                    {name}
                  </div>
                  <div style={{
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(14px, 1.8vw, 18px)',
                    color: 'var(--amber)',
                  }}>
                    {price}
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
                  {items.map((item) => (
                    <li key={item} style={{
                      fontSize: '13px',
                      color: 'var(--muted)',
                      lineHeight: 1.6,
                      paddingLeft: '14px',
                      position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--amber)',
                        fontSize: '10px',
                      }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7 }}>
            Not sure which fits?{' '}
            <a
              href={`mailto:${WEB_INQUIRY_EMAIL}?subject=Web Build Inquiry`}
              style={{ color: 'var(--amber)', textDecoration: 'underline' }}
            >
              Send the details and I&apos;ll help you scope it.
            </a>
          </p>
        </section>

        {/* ── This Site Is The Demo ─────────────────────────────── */}
        <section style={{
          background: 'var(--off-black)',
          border: '1px solid var(--border)',
          padding: 'clamp(24px, 4vw, 40px)',
        }}>
          <p style={{
            fontSize: 'clamp(14px, 2vw, 17px)',
            color: 'var(--white)',
            lineHeight: 1.8,
            maxWidth: '620px',
            marginBottom: '24px',
          }}>
            <strong style={{ color: 'var(--amber)', fontFamily: 'Conthrax, sans-serif', fontSize: '0.85em' }}>
              You&apos;re looking at the demo.
            </strong>{' '}
            The Bae Agenda runs my real bookings, events, and content. I built these tools
            for this site first, then adapted the same approach for client work.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href={`mailto:${WEB_INQUIRY_EMAIL}?subject=Web Build Inquiry`} className="btn-primary">
              Project Inquiry
            </a>
          </div>
        </section>

      </div>

      {/* ── Signal Chain + Tech Stack ─────────────────────────── */}
      <BuiltSection aboutQuote={content.about_quote} />

      {/* ── Retainer Callout ──────────────────────────────────── */}
      <div className="section-container" style={{ paddingTop: 0 }}>
        <section style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '48px',
          display: 'grid',
          gap: '12px',
          maxWidth: '620px',
        }}>
          <span className="section-label">After Launch</span>
          <h2 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(20px, 3vw, 32px)',
            color: 'var(--white)',
            lineHeight: 1.1,
            margin: 0,
          }}>
            Maintenance &amp; Growth
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8 }}>
            Sites change after launch. I offer a monthly retainer for updates, new features,
            fixes, and the small stuff that comes up over time.
          </p>
          <p style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(14px, 2vw, 18px)',
            color: 'var(--amber)',
          }}>
            $500 / month — updates, new features, hosting management
          </p>
          <div>
            <a
              href={`mailto:${WEB_INQUIRY_EMAIL}?subject=Retainer Inquiry`}
              className="btn-ghost"
              style={{ display: 'inline-flex' }}
            >
              Ask about a retainer →
            </a>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '48px', marginBottom: '0' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: '24px' }}>FAQ</span>
          <div style={{ display: 'grid', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', marginBottom: '48px' }}>
            {[
              {
                q: 'What\'s the deposit?',
                a: '50% upfront to lock the date. The remaining 50% is due at launch.',
              },
              {
                q: 'Do I need to provide content?',
                a: 'Yes. You provide the copy, images, and brand assets; I build the site around them.',
              },
              {
                q: 'Do you work remotely?',
                a: 'Yes. I work remotely, so email and video calls are enough.',
              },
              {
                q: 'How many revisions are included?',
                a: 'Standard and Custom tiers include 2 rounds of revisions. Starter is 1 round.',
              },
              {
                q: 'I\'m already on GoDaddy or Wix — can I keep my domain?',
                a: 'Yes. You can keep your domain; I’ll handle the DNS setup when it is time to launch.',
              },
              {
                q: 'What happens after the site launches?',
                a: 'You own the code. If you want ongoing updates or support, a monthly retainer is available.',
              },
            ].map(({ q, a }) => (
              <div key={q} style={{
                background: 'var(--off-black)',
                padding: '28px 28px',
                display: 'grid',
                gap: '12px',
              }}>
                <div style={{
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: '15px',
                  color: 'var(--white)',
                  lineHeight: 1.5,
                }}>
                  {q}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.85 }}>
                  {a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section style={{
          borderTop: '1px solid var(--border)',
          padding: '64px 0 32px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(22px, 4vw, 44px)',
            color: 'var(--white)',
            lineHeight: 1.1,
            margin: '0 0 12px',
          }}>
            Have a web project<br />
            <span style={{ color: 'var(--amber)' }}>in mind?</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.7 }}>
            Share the scope, timeline, and what you need the site to do.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`mailto:${WEB_INQUIRY_EMAIL}?subject=Web Build Inquiry`} className="btn-primary">
              Project Inquiry
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
