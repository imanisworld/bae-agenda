import type { Metadata } from 'next'
import Link from 'next/link'
import { getContentMap } from '@/lib/db/content'
import BuiltSection from '@/components/public/BuiltSection'
import { PORTFOLIO_HIGHLIGHTS } from '@/lib/portfolio-data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Built | Custom Web Development for Artists & Brands — DJ B.A.E.',
  description:
    'Custom full-stack websites for DJs, artists, promoters, and creative businesses. Real code — not Wix, not Squarespace. Booking platforms, admin dashboards, and brand presence built from scratch.',
  openGraph: {
    title: 'Built from Scratch — DJ B.A.E.',
    description:
      'No templates. No builders. Custom sites for artists and brands — with booking flows, admin panels, and real infrastructure. Limited availability.',
  },
}

const CONTENT_KEYS = ['about_quote', 'booking_email'] as const

const CONTACT_EMAIL = 'baebookings@proton.me'

function statCard(label: string, value: string, sub: string) {
  return (
    <div className="build-console-module">
      <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(24px, 3vw, 34px)', color: 'var(--white)', marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
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
  const bookingEmail = content.booking_email ?? CONTACT_EMAIL

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="section-container" style={{ display: 'grid', gap: '56px', paddingTop: 0 }}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section>
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
            Designed, engineered, and deployed by <strong style={{ color: 'var(--white)' }}>DJ B.A.E.</strong> —
            not a template, not Wix, not Squarespace, not a drag-and-drop builder.
            Every page, every component, every flow written from scratch in real code.
          </p>
          <p style={{ fontSize: '15px', color: 'var(--amber)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '28px', fontWeight: 500 }}>
            This stack is available for your brand.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href={`mailto:${bookingEmail}?subject=Web Build Inquiry`} className="btn-primary">
              Start a Project →
            </a>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────── */}
        <section
          className="build-console-module-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}
        >
          {statCard('Build Time', '~3 Months', 'Plan for 3 months depending on the scope.')}
          {statCard('Clients Available', '2', 'Currently taking limited new projects.')}
          {statCard('System Layers', '4', 'Public site, admin panel, CMS, and booking flow.')}
          {statCard('Templates Used', '0', 'Every page, component, and layout is custom.')}
        </section>

        {/* ── What Was Built ───────────────────────────────────── */}
        <section
          className="build-console-mixer"
          style={{ padding: '26px', display: 'grid', gap: '16px' }}
        >
          <div className="build-console-fx-header">
            <span>What Was Built — For This Site</span>
            <div className="build-console-mini-chips">
              <span>Full-Stack</span>
              <span>Custom</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {PORTFOLIO_HIGHLIGHTS.map((item) => (
              <div key={item} className="build-console-module card-hover-amber" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--white)', lineHeight: 1.7 }}>{item}</div>
              </div>
            ))}
          </div>
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
            If you&apos;re on GoDaddy, Wix, or Squarespace and outgrowing it — or if you have no site at all —
            this is the alternative. You own everything. No monthly platform fees. No limits.
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
                    fontSize: '9px',
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
                      fontSize: '12px',
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

          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>
            Not sure which fits?{' '}
            <a
              href={`mailto:${bookingEmail}?subject=Web Build Inquiry`}
              style={{ color: 'var(--amber)', textDecoration: 'underline' }}
            >
              Send the details and we&apos;ll figure it out together.
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
            The Bae Agenda is a live, production system handling real bookings, real events,
            and real data. Every feature on this page was built for this site first —
            then made available for yours.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href={`mailto:${bookingEmail}?subject=Web Build Inquiry`} className="btn-primary">
              Start a Project →
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
            Sites need updates. Features get added. Things break. A monthly retainer keeps your site
            moving without the back-and-forth of a new project every time.
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
              href={`mailto:${bookingEmail}?subject=Retainer Inquiry`}
              className="btn-ghost"
              style={{ display: 'inline-flex' }}
            >
              Ask about retainer →
            </a>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section style={{
          borderTop: '1px solid var(--border)',
          padding: '64px 0 80px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(22px, 4vw, 44px)',
            color: 'var(--white)',
            lineHeight: 1.1,
            margin: '0 0 12px',
          }}>
            Ready to replace your<br />
            <span style={{ color: 'var(--amber)' }}>GoDaddy site?</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.7 }}>
            Limited availability. Currently taking 2 new projects.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`mailto:${bookingEmail}?subject=Web Build Inquiry`} className="btn-primary">
              Start a Project →
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
