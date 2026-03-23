import type { Metadata } from 'next'
import { getPublishedMixes } from '@/lib/db/mixes'
import { getUpcomingEvents } from '@/lib/db/events'
import { getContentMap } from '@/lib/db/content'
import BuiltSection from '@/components/public/BuiltSection'
import { PORTFOLIO_HIGHLIGHTS } from '@/lib/portfolio-data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Built | Custom Web Development by DJ B.A.E.',
  description:
    'This site was designed and built from scratch by DJ B.A.E. — a custom booking platform, admin dashboard, and brand presence. Available as a service for artists and brands.',
  openGraph: {
    title: 'Built from Scratch — DJ B.A.E.',
    description:
      'No templates. No builders. A custom full-stack platform with bookings, CMS, and public presence. Available for your brand.',
  },
}

const CONTENT_KEYS = ['about_quote', 'booking_email'] as const

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

export default async function BuiltPage() {
  const [content, mixes, events] = await Promise.all([
    getContentMap([...CONTENT_KEYS]),
    getPublishedMixes(24),
    getUpcomingEvents(24),
  ])

  const bookingEmail = content.booking_email ?? ''

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="section-container" style={{ display: 'grid', gap: '36px', paddingTop: 0 }}>

        {/* Page header */}
        <section>
          <div className="hardware-heading">
            <span className="section-label">Built</span>
          </div>
          <h1
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(34px, 5.2vw, 64px)',
              lineHeight: 0.95,
              color: 'var(--white)',
              margin: '0 0 24px',
            }}
          >
            Built from<br />
            <span style={{ color: 'var(--amber)' }}>Scratch.</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '12px' }}>
            Designed, engineered, and deployed by <strong style={{ color: 'var(--white)' }}>DJ B.A.E.</strong> —
            not a template, not Wix, not Squarespace, not a drag-and-drop builder.
            Every page, every component, every flow written from scratch in real code.
            A custom full-stack platform with live bookings, a private admin panel, content management,
            and a full public presence — all in one system.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '20px' }}>
            This same work is available as a service. If you need a real site — not a builder — reach out.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {bookingEmail && (
              <a href={`mailto:${bookingEmail}`} className="btn-ghost">Get in Touch</a>
            )}
          </div>
        </section>

        {/* Live system stats */}
        <section
          className="build-console-module-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}
        >
          {statCard('Published Mixes', String(mixes.length), 'Live in the catalog. Managed through the admin.')}
          {statCard('Upcoming Events', String(events.length), 'Public calendar entries — live data on every load.')}
          {statCard('System Layers', '4', 'Public site, admin panel, press kit, and booking flow.')}
          {statCard('Templates Used', '0', 'Every page, component, and layout is custom.')}
        </section>

        {/* What Was Built */}
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
                <div style={{ fontSize: '13px', color: 'var(--white)', lineHeight: 1.7 }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* This Is A Service */}
        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '48px' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: '8px' }}>
            Available As A Service
          </span>
          <h2 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(22px, 3.5vw, 40px)',
            color: 'var(--white)',
            lineHeight: 1.1,
            margin: '0 0 16px',
          }}>
            Need something<br />
            <span style={{ color: 'var(--amber)' }}>built?</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '16px' }}>
            This is not Wix. Not Squarespace. Not a website builder, a theme, or a subscription tool.
            Every line of code on this site was written by hand — custom architecture, custom design, custom logic.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '36px' }}>
            The same system powering this site — bookings, admin panel, content management, public presence —
            can be built for your brand or business. You own it. No monthly fees to a platform. No limits on what it can do.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '36px',
          }}>
            {[
              {
                title: 'Artist & Brand Sites',
                desc: 'Full public presence — bio, events, press, social links, and booking form. Built to rank on Google.',
              },
              {
                title: 'Booking Platforms',
                desc: 'Custom inquiry flow with client records, status tracking, invoice generation, and email notifications.',
              },
              {
                title: 'Admin Dashboards',
                desc: 'Manage content, events, bookings, and clients from a private dashboard — no third-party tools needed.',
              },
              {
                title: 'Content Systems',
                desc: 'CMS-backed copy, mixes, portfolio entries, and media — all editable from the admin without touching code.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="build-console-module card-hover-amber" style={{ padding: '20px' }}>
                <div style={{
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--amber)',
                  marginBottom: '10px',
                }}>
                  {title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {bookingEmail && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href={`mailto:${bookingEmail}?subject=Web Build Inquiry`} className="btn-primary">
                Start a Conversation →
              </a>
              <a href={`mailto:${bookingEmail}`} className="btn-ghost">
                {bookingEmail}
              </a>
            </div>
          )}
        </section>

      </div>

      {/* Full tech stack breakdown */}
      <BuiltSection aboutQuote={content.about_quote} />
    </div>
  )
}
