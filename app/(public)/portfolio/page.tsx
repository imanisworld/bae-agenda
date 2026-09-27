import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPortfolioEntries, getFeaturedPortfolioEntries, getPortfolioStats } from '@/app/actions/portfolio'
import PortfolioArchive from '@/components/public/PortfolioArchive'\nimport PortfolioArchiveHero from '@/components/public/PortfolioArchiveHero'
import { getContentMap } from '@/lib/db/content'
import { CONTENT_DEFAULTS, DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'

export const metadata: Metadata = {
  title: 'Portfolio | DJ BAE Gig History — Indianapolis & Chicago',
  alternates: {
    canonical: '/portfolio',
  },
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
      fontSize: '10px',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'rgba(250,248,243,0.5)',
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
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
  const bookingEmail = content.booking_email || CONTENT_DEFAULTS.booking_email || DEFAULT_BOOKING_EMAIL

  return (
    <div style={{ background: 'var(--black)' }}>

      <PortfolioArchiveHero
        prints={featured
          .filter((entry) => Boolean(entry.photo_url))
          .slice(0, 3)
          .map((entry) => ({
            id: entry.id,
            event_name: entry.event_name,
            year: entry.year,
            photo_url: entry.photo_url as string,
          }))}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 max(24px, calc(var(--safe-right) + 20px)) 0 max(24px, calc(var(--safe-left) + 20px))' }}>

        {/* ── Portfolio summary ───────────────────────────────── */}
        <section style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 28px',
          alignItems: 'baseline',
          padding: '28px 0',
          borderBottom: '1px solid var(--border)',
          marginBottom: '56px',
        }}>
          {[
            { value: stats.total || '—', label: 'events' },
            { value: stats.cities || '—', label: 'cities' },
            { value: stats.yearsActive, label: 'active years' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <strong style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: 'clamp(18px, 2.4vw, 28px)',
                color: 'var(--white)',
                fontWeight: 600,
              }}>
                {value}
              </strong>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{label}</span>
            </div>
          ))}
        </section>

        {/* ── Featured ──────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section style={{ marginBottom: '64px' }}>
            <span className="section-label">Selected Events</span>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
              gap: '16px',
            }}>
              {featured.map((entry) => (
                <div
                  key={entry.id}
                  id={`entry-${entry.id}`}
                  className="card-hover portfolio-featured-card"
                  style={{
                    background: 'var(--off-black)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    scrollMarginTop: 'calc(var(--nav-height) + 24px)',
                  }}
                >
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

                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      {[entry.venue, entry.city].filter(Boolean).join(' · ')}
                    </div>

                    {entry.notes && (
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: 1.65,
                        color: 'rgba(250,248,243,0.78)',
                        fontStyle: 'italic',
                      }}>
                        {entry.notes}
                      </p>
                    )}

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
        <div id="archive"><PortfolioArchive entries={entries.map((e) => ({
          id:         e.id,
          event_name: e.event_name,
          venue:      e.venue ?? null,
          city:       e.city,
          year:       e.year,
          tags:       e.tags ?? [],
          featured:   e.featured,
        }))} /></div>

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
            Planning an event?
          </p>
          <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '24px' }}>
            Share the date, room, and format you have in mind.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book" className="btn-primary">Booking Inquiry</Link>
            {bookingEmail && <a href={`mailto:${bookingEmail}`} className="btn-ghost">Email</a>}
          </div>
        </section>

      </div>
    </div>
  )
}
