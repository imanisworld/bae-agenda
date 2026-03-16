import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SELECTED_WORK, PORTFOLIO_HIGHLIGHTS } from '@/lib/portfolio-data'
import { getPublishedMixes } from '@/lib/db/mixes'
import { getUpcomingEvents } from '@/lib/db/events'
import { getContentMap } from '@/lib/db/content'

export const metadata: Metadata = {
  title: 'Portfolio — DJ B.A.E.',
  description: 'Selected work, system highlights, and a portfolio view of DJ B.A.E. built to showcase execution beyond the public-facing homepage.',
}

const CONTENT_KEYS = ['about_quote', 'booking_email'] as const

function statCard(label: string, value: string, sub: string) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '20px',
      }}
    >
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

  const about = content.about_quote ?? 'Chicago-based DJ, curator, and experience architect.'
  const bookingEmail = content.booking_email ?? 'Booking available on request.'

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="section-container" style={{ display: 'grid', gap: '36px', paddingTop: 0 }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: '28px',
            alignItems: 'start',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ width: '22px', height: '1px', background: 'var(--violet)', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Portfolio
              </span>
            </div>
            <h1
              style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: 'clamp(34px, 6vw, 72px)',
                lineHeight: 0.95,
                color: 'var(--white)',
                margin: '0 0 18px',
              }}
            >
              Work,
              <br />
              Systems,
              <br />
              Process.
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '620px' }}>
              This route exists to show the deeper work behind the public site: selected event work, booking flow thinking, content systems, and the product decisions that make the brand usable.
            </p>
          </div>

          <div
            style={{
              border: '1px solid var(--border)',
              background: 'linear-gradient(180deg, rgba(155,93,229,0.08), rgba(255,255,255,0.01))',
              padding: '18px',
              display: 'grid',
              gap: '16px',
            }}
          >
            <div style={{ position: 'relative', minHeight: '220px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Image
                src="/photos/IMG_1120.JPG.jpeg"
                alt="DJ B.A.E. portfolio image"
                fill
                sizes="(max-width: 900px) 100vw, 420px"
                style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(8,8,8,0.08), rgba(8,8,8,0.22) 48%, rgba(8,8,8,0.64) 100%)',
                }}
              />
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Portfolio Summary
            </div>
            <div style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.75 }}>
              {about}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/admin-demo" className="btn-ghost">
                View Admin Demo
              </Link>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.7 }}>
              Contact: {bookingEmail}
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <h2 className="section-heading" style={{ marginBottom: 0 }}>Selected Work</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '18px' }}>
            {SELECTED_WORK.map((item) => (
              <article
                key={item.id}
                className="card-hover"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  padding: '22px',
                  display: 'grid',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--violet)', marginBottom: '10px' }}>
                    {item.category}
                  </div>
                  <h3 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '18px', color: 'var(--white)', lineHeight: 1.25, margin: 0 }}>
                    {item.title}
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {item.year}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--white)', lineHeight: 1.7, margin: 0 }}>
                  {item.summary}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {item.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      style={{
                        fontSize: '10px',
                        color: 'var(--muted)',
                        border: '1px solid var(--border)',
                        padding: '6px 9px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {statCard('Published Mixes', String(mixes.length), 'Pulled from the live site catalog.')}
          {statCard('Upcoming Events', String(events.length), 'Public-facing calendar entries currently live.')}
          {statCard('Selected Work', String(SELECTED_WORK.length), 'Editable portfolio showcase items for presentations and reviews.')}
          {statCard('System Layers', '4', 'Brand site, admin demo, press kit surface, and booking workflow.')}
        </section>

        <section
          style={{
            border: '1px solid var(--border)',
            background: 'var(--off-black)',
            padding: '26px',
            display: 'grid',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Product Highlights
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {PORTFOLIO_HIGHLIGHTS.map((item) => (
              <div key={item} style={{ border: '1px solid var(--border)', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontSize: '13px', color: 'var(--white)', lineHeight: 1.7 }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
