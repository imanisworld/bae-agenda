/**
 * PORTFOLIO TEASER — Server Component
 * Shows 3 featured portfolio entries between Events and Booking.
 * Slim editorial style — not a full section, just a surface.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface PortfolioEntry {
  id:         string
  event_name: string
  city:       string
  year:       number
  tags:       string[]
  featured:   boolean
}

async function getFeatured(): Promise<PortfolioEntry[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('id, event_name, city, year, tags, featured')
      .eq('featured', true)
      .order('year', { ascending: false })
      .limit(3)
    return (data ?? []) as PortfolioEntry[]
  } catch {
    return []
  }
}

export default async function PortfolioTeaserSection() {
  const entries = await getFeatured()
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
          </div>
          <Link href="/portfolio" className="btn-ghost" style={{ whiteSpace: 'nowrap' }}>
            See Full Archive →
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: 'var(--off-black)',
                padding: '20px 22px',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div style={{
                fontSize: '9px',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}>
                {entry.year}
              </div>
              <div style={{
                fontFamily: 'Conthrax, sans-serif',
                fontSize: 'clamp(13px, 1.8vw, 16px)',
                color: 'var(--white)',
                lineHeight: 1.2,
              }}>
                {entry.event_name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                {entry.city}
              </div>
              {entry.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {entry.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '8px',
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
          ))}
        </div>
      </div>
    </section>
  )
}
