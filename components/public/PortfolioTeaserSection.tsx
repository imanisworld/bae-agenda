/**
 * PORTFOLIO TEASER — Server Component
 * Shows 3 featured portfolio entries between Events and Booking.
 * Slim editorial style — not a full section, just a surface.
 */
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPortfolioStats } from '@/app/actions/portfolio'

interface PortfolioEntry {
  id:         string
  event_name: string
  city:       string
  year:       number
  tags:       string[]
  featured:   boolean
  photo_url:  string | null
  notes:      string | null
}

function contextualLabel(entry: PortfolioEntry) {
  const tag = entry.tags.find(Boolean)
  return `${entry.year} • ${tag ?? 'Live Set'}`
}

async function getFeatured(): Promise<PortfolioEntry[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('id, event_name, city, year, tags, featured, photo_url, notes')
      .eq('featured', true)
      .order('year', { ascending: false })
      .limit(3)
    return (data ?? []) as PortfolioEntry[]
  } catch {
    return []
  }
}

export default async function PortfolioTeaserSection() {
  const [featuredEntries, stats] = await Promise.all([
    getFeatured(),
    getPortfolioStats(),
  ])

  const entries = featuredEntries.sort((a, b) => {
    const aPriority = /wnba/i.test(a.event_name) ? 0 : 1
    const bPriority = /wnba/i.test(b.event_name) ? 0 : 1
    if (aPriority !== bPriority) return aPriority - bPriority
    return b.year - a.year
  })
  if (entries.length === 0) return null

  return (
    <section
      aria-label="Selected Gigs"
      style={{
        background: 'var(--bg-sunken, #08080a)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="section-container" style={{ paddingTop: '56px', paddingBottom: '56px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '28px',
        }}>
          <div>
            <div className="hardware-heading">
              <span className="section-label">Experience</span>
            </div>
            <h2 style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(20px, 3.5vw, 32px)',
              color: 'var(--white)',
              lineHeight: 1.1,
              margin: 0,
            }}>
              On The Record
            </h2>
            <p style={{
              marginTop: '12px',
              maxWidth: '520px',
              fontSize: '15px',
              lineHeight: 1.75,
              color: 'var(--muted)',
            }}>
              A quick proof strip of the rooms, audiences, and formats already in motion.
            </p>
          </div>
          <Link href="/portfolio" className="btn-ghost" style={{ whiteSpace: 'nowrap' }}>
            Explore All Events →
          </Link>
        </div>

        <div className="portfolio-teaser-grid">
          <Link
            href="/portfolio"
            className="portfolio-teaser-logo-panel portfolio-teaser-anchor-panel portfolio-teaser-link-card"
            aria-label="Explore DJ B.A.E. event archive"
          >
            <div className="portfolio-teaser-logo-copy">
              <div className="portfolio-teaser-meta">Experience</div>
              <h3 className="portfolio-teaser-title">Played Across</h3>
              <p className="portfolio-teaser-desc">
                {stats.cities} cities • {stats.yearsActive}
              </p>
              <p className="portfolio-teaser-proof">{stats.total} documented events</p>
              <p className="portfolio-teaser-footnote"> </p>
              <div style={{
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '10px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(250,248,243,0.52)',
              }}>
                <span style={{ width: '16px', height: '1px', background: 'rgba(155,93,229,0.42)', display: 'block' }} />
                <span></span>
              </div>
            </div>
          </Link>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
          }}>
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/portfolio#entry-${entry.id}`}
                className="portfolio-teaser-event-card"
                aria-label={`View the ${entry.event_name} case study`}
                style={{
                  background: 'var(--off-black)',
                  display: 'grid',
                  gridTemplateRows: entry.photo_url ? 'auto 1fr' : '1fr',
                  textDecoration: 'none',
                }}
              >
                {entry.photo_url && (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10' }}>
                    <Image
                      src={entry.photo_url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ padding: '20px 22px', display: 'grid', gap: '8px' }}>
                  <div className="portfolio-teaser-event-meta" style={{
                    fontSize: '9px',
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                  }}>
                    {contextualLabel(entry)}
                  </div>
                  <div style={{
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(13px, 1.8vw, 16px)',
                    color: 'var(--white)',
                    lineHeight: 1.2,
                  }}>
                    {entry.event_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {entry.city}
                  </div>
                  {entry.notes ? (
                    <p style={{
                      margin: '2px 0 0',
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: 'rgba(250,248,243,0.7)',
                      fontStyle: 'italic',
                    }}>
                      {entry.notes}
                    </p>
                  ) : null}
                  {entry.tags.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {entry.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '10px',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'var(--violet)',
                            background: 'rgba(155,93,229,0.1)',
                            border: '1px solid rgba(155,93,229,0.18)',
                            borderRadius: '100px',
                            padding: '2px 7px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
