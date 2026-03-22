import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { GIG_HISTORY, PRESS_PHOTOS } from '@/lib/portfolio-data'

export const metadata: Metadata = {
  title: 'Portfolio — DJ B.A.E.',
  description:
    'Gig history, live events, and press shots from DJ B.A.E. — Chicago-based DJ and curator available for club nights, private events, and more.',
  openGraph: {
    title: 'DJ B.A.E. — Portfolio',
    description:
      'Nights, residencies, and events. A record of what has been built on the floor.',
  },
}

const FEATURED = GIG_HISTORY.filter((g) => g.featured)
const ARCHIVE  = GIG_HISTORY.filter((g) => !g.featured)

export default function PortfolioPage() {
  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="section-container" style={{ paddingTop: 0 }}>

        {/* Page header */}
        <section style={{ marginBottom: '48px' }}>
          <div className="hardware-heading">
            <span className="section-label">Portfolio</span>
          </div>
          <h1
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(34px, 5.5vw, 72px)',
              lineHeight: 0.95,
              color: 'var(--white)',
              margin: '0 0 20px',
            }}
          >
            Nights &amp;<br />
            <span style={{ color: 'var(--violet)' }}>Events.</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '520px', marginBottom: '20px' }}>
            A record of what has been built on the floor — recurring nights, community series,
            and open-format sets across Chicago and Indianapolis.
          </p>
          <Link href="/book" className="btn-primary">Book DJ B.A.E. →</Link>
        </section>

        {/* Featured gigs — card grid */}
        {FEATURED.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <div className="hardware-heading">
              <span className="section-label" style={{ color: 'var(--violet)' }}>Featured</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {FEATURED.map((gig) => (
                <div
                  key={gig.id}
                  className="build-console-module card-hover"
                  style={{ padding: '24px', display: 'grid', gap: '12px' }}
                >
                  <div className="build-console-module-top">
                    <span className="build-console-module-category">{gig.tags[0]}</span>
                    <span className="build-console-module-index">{gig.year}</span>
                  </div>
                  <div style={{
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(18px, 2.5vw, 24px)',
                    color: 'var(--white)',
                    lineHeight: 1.1,
                  }}>
                    {gig.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
                    {gig.venue} · {gig.city}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                    {gig.date}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {gig.tags.slice(1).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase',
                          color: 'var(--violet)', background: 'rgba(155,93,229,0.1)',
                          border: '1px solid rgba(155,93,229,0.2)',
                          borderRadius: '100px', padding: '3px 8px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Press photos */}
        {PRESS_PHOTOS.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <div className="hardware-heading">
              <span className="section-label">Press Photos</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {PRESS_PHOTOS.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    position: 'relative', aspectRatio: '4/3',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    background: 'var(--surface)',
                  }}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Archive — chronological list */}
        {ARCHIVE.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <div className="hardware-heading">
              <span className="section-label">Archive</span>
            </div>
            <div style={{ display: 'grid', gap: '1px', border: '1px solid var(--border)' }}>
              {ARCHIVE.map((gig) => (
                <div
                  key={gig.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 20px',
                    background: 'var(--off-black)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '15px', color: 'var(--white)', marginBottom: '4px' }}>
                      {gig.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {gig.venue} · {gig.city}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.08em' }}>{gig.year}</div>
                    <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', opacity: 0.6, marginTop: '2px' }}>
                      {gig.tags[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.8 }}>
            Ready to add your event to this list?
          </p>
          <Link href="/book" className="btn-primary">Start a Booking →</Link>
        </section>

      </div>
    </div>
  )
}
