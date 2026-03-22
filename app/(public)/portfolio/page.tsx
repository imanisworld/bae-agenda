import type { Metadata } from 'next'
import Link from 'next/link'
import { PORTFOLIO_HIGHLIGHTS } from '@/lib/portfolio-data'
import { getPublishedMixes } from '@/lib/db/mixes'
import { getUpcomingEvents } from '@/lib/db/events'
import { getContentMap } from '@/lib/db/content'
import BuiltSection from '@/components/public/BuiltSection'

export const metadata: Metadata = {
  title: 'Portfolio — DJ B.A.E.',
  description: 'This site was designed and built from scratch — no templates, no builders. A full-stack booking platform, content system, and brand presence.',
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

export default async function PortfolioPage() {
  const [content, mixes, events] = await Promise.all([
    getContentMap([...CONTENT_KEYS]),
    getPublishedMixes(24),
    getUpcomingEvents(24),
  ])

  const bookingEmail = content.booking_email ?? 'Booking available on request.'

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="section-container" style={{ display: 'grid', gap: '36px', paddingTop: 0 }}>

        {/* Page header — clear purpose statement */}
        <section>
          <div className="hardware-heading">
            <span className="section-label">Portfolio</span>
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
            <span className="hardware-title-accent">Scratch.</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '8px' }}>
            This is not a template or a hosted service. The Bae Agenda is a custom-designed,
            full-stack web platform built to handle real bookings, content management, and
            brand presence — all in one system.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '560px', marginBottom: '20px' }}>
            If you are looking for something like this built for your brand or project,
            that work is available.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/admin-demo" className="btn-ghost">View Admin Demo</Link>
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

        {/* Feature highlights */}
        <section
          className="build-console-mixer"
          style={{ padding: '26px', display: 'grid', gap: '16px' }}
        >
          <div className="build-console-fx-header">
            <span>What Was Built</span>
            <div className="build-console-mini-chips">
              <span>Full-Stack</span>
              <span>Custom</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {PORTFOLIO_HIGHLIGHTS.map((item) => (
              <div key={item} className="build-console-module" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--white)', lineHeight: 1.7 }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Full tech stack breakdown */}
      <BuiltSection aboutQuote={content.about_quote} />
    </div>
  )
}
