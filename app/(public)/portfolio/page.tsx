import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPortfolioEntries, getFeaturedPortfolioEntries, getPortfolioStats } from '@/app/actions/portfolio'
import PortfolioArchive from '@/components/public/PortfolioArchive'
import { getContentMap } from '@/lib/db/content'
import { CONTENT_DEFAULTS } from '@/lib/content-schema'

export const metadata: Metadata = {
  title: 'Portfolio | DJ BAE Gig History — Indianapolis & Chicago',
  description:
    'Full gig history, featured events, and press for DJ B.A.E. — Indianapolis & Chicago DJ. Club nights, festivals, private events, and more.',
  openGraph: {
    title: 'DJ B.A.E. — Portfolio',
    description: 'From basements to festivals. Every room, every crowd.',
    url: 'https://thebaeagenda.com/portfolio',
  },
}

function TagChip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: '9px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--violet)',
      background: 'rgba(155,93,229,0.1)',
      border: '1px solid rgba(155,93,229,0.2)',
      borderRadius: '100px',
      padding: '3px 8px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export default async function PortfolioPage() {
  const [entries, featured, stats, content] = await Promise.all([
    getPortfolioEntries(),
    getFeaturedPortfolioEntries(),
    getPortfolioStats(),
    getContentMap(['booking_email']),
  ])
  const bookingEmail = content.booking_email ?? CONTENT_DEFAULTS.booking_email ?? 'bookings@thebaeagenda.com'

  return (
    <div style={{ background: 'var(--black)' }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        minHeight: '52vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'calc(68px + 48px) clamp(24px, 5vw, 72px) 48px',
        background: 'linear-gradient(180deg, var(--bg-sunken) 0%, var(--black) 100%)',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient background — video removed (file not available) */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div className="hardware-heading">
            <span className="section-label">Chicago · Indianapolis · ATL</span>
          </div>
          <h1 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(44px, 6vw, 80px)',
            lineHeight: 0.95,
            color: 'var(--white)',
            margin: '0 0 20px',
          }}>
            The<br />
            <span style={{ color: 'var(--violet)' }}>Resume.</span>
          </h1>
          <p style={{
            fontSize: 'clamp(13px, 1.8vw, 16px)',
            color: 'var(--muted)',
            lineHeight: 1.7,
            maxWidth: '480px',
            marginBottom: '28px',
          }}>
            From basements to festivals. Every room, every crowd.
          </p>
          <Link href="/book" className="btn-primary">Book DJ B.A.E. →</Link>
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(24px, 5vw, 72px)' }}>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          margin: '48px 0',
        }}>
          {[
            { label: 'Total Events',    value: stats.total   || '—' },
            { label: 'Cities',          value: stats.cities  || '—' },
            { label: 'Years Active',    value: stats.yearsActive    },
            { label: 'Featured Events', value: stats.featured || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--off-black)',
              padding: '28px 24px',
              display: 'grid',
              gap: '8px',
              minWidth: 0,
            }}>
              <div style={{
                fontSize: '9px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}>
                {label}
              </div>
              <div style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: typeof value === 'string' && value.length > 6
                  ? 'clamp(14px, 2vw, 20px)'
                  : 'clamp(22px, 3vw, 32px)',
                color: 'var(--white)',
                lineHeight: 1.1,
                wordBreak: 'break-word',
              }}>
                {value}
              </div>
            </div>
          ))}
        </section>

        {/* ── Featured ──────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section style={{ marginBottom: '64px' }}>
            <div className="hardware-heading">
              <span className="section-label" style={{ color: 'var(--violet)' }}>Featured</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {featured.map((entry) => (
                <div key={entry.id} className="card-hover" style={{
                  background: 'var(--off-black)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}>
                  {/* Photo only — no placeholder when missing */}
                  {entry.photo_url && (
                    <div style={{ position: 'relative', aspectRatio: '3/2', flexShrink: 0 }}>
                      <Image
                        src={entry.photo_url}
                        alt={entry.event_name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div style={{ padding: '20px', display: 'grid', gap: '10px', flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}>
                      <h3 style={{
                        fontFamily: 'Conthrax, sans-serif',
                        fontSize: 'clamp(14px, 2vw, 18px)',
                        color: 'var(--white)',
                        lineHeight: 1.15,
                        margin: 0,
                      }}>
                        {entry.event_name}
                      </h3>
                      <span style={{
                        fontFamily: 'Conthrax, sans-serif',
                        fontSize: '13px',
                        color: 'var(--muted)',
                        flexShrink: 0,
                      }}>
                        {entry.year}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {[entry.venue, entry.city].filter(Boolean).join(' · ')}
                    </div>

                    {entry.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {entry.tags.slice(0, 3).map((tag) => (
                          <TagChip key={tag} label={tag} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Full Archive — client component with filters ───────── */}
        <PortfolioArchive entries={entries.map((e) => ({
          id:         e.id,
          event_name: e.event_name,
          venue:      e.venue ?? null,
          city:       e.city,
          year:       e.year,
          tags:       e.tags ?? [],
          featured:   e.featured,
        }))} />

        {/* ── Press ─────────────────────────────────────────────── */}
        <section style={{
          borderTop: '1px solid var(--border)',
          padding: '56px 0',
        }}>
          <span className="section-label" style={{ display: 'block', marginBottom: '24px' }}>
            Press &amp; Features
          </span>
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <a
              href="https://mokbpresents.com/artist/dj-b-a-e/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--off-black)',
                border: '1px solid var(--border)',
                padding: '16px 20px',
                color: 'var(--white)',
                textDecoration: 'none',
                fontSize: '13px',
                transition: 'border-color 0.2s ease',
              }}
              className="card-hover"
            >
              <span style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'var(--violet)',
              }}>
                MOKB Presents
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                Artist Feature →
              </span>
            </a>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{
          borderTop: '1px solid var(--border)',
          padding: '40px 0 24px',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(18px, 3vw, 28px)',
            color: 'var(--white)',
            marginBottom: '8px',
          }}>
            Let&apos;s add your event to this list.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px' }}>
            Open to club nights, festivals, private events, and everything in between.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book" className="btn-primary">Start a Booking →</Link>
            {bookingEmail && <a href={`mailto:${bookingEmail}`} className="btn-ghost">Email Us</a>}
          </div>
        </section>

      </div>
    </div>
  )
}
