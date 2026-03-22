import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Portfolio — DJ B.A.E.',
  description:
    'From basements to festivals. A full gig history from DJ B.A.E. — Chicago, Indianapolis, and beyond.',
  openGraph: {
    title: 'DJ B.A.E. — The Resume.',
    description: 'From basements to festivals. Every room, every crowd.',
  },
}

interface PortfolioEntry {
  id:         string
  event_name: string
  venue:      string | null
  city:       string
  year:       number
  date:       string | null
  tags:       string[]
  photo_url:  string | null
  featured:   boolean
  notes:      string | null
}

async function getEntries(): Promise<PortfolioEntry[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('portfolio_entries')
      .select('*')
      .order('year', { ascending: false })
      .order('event_name', { ascending: true })
    return (data ?? []) as PortfolioEntry[]
  } catch {
    return []
  }
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
  const entries = await getEntries()

  const featured = entries.filter((e) => e.featured)
  const allYears = [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a)
  const cities   = [...new Set(entries.map((e) => e.city.split(',')[0].trim()))].length
  const minYear  = entries.length ? Math.min(...entries.map((e) => e.year)) : new Date().getFullYear()
  const yearsActive = `${minYear}–${new Date().getFullYear()}`

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        minHeight: '52vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 'calc(68px + 60px) clamp(24px, 5vw, 72px) 56px',
        background: 'linear-gradient(180deg, var(--bg-sunken) 0%, var(--black) 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          margin: '48px 0',
        }}>
          {[
            { label: 'Total Events',    value: String(entries.length) },
            { label: 'Cities',          value: String(cities)         },
            { label: 'Years Active',    value: yearsActive            },
            { label: 'Featured Events', value: String(featured.length)},
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--off-black)',
              padding: '28px 24px',
              display: 'grid',
              gap: '8px',
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
                fontSize: 'clamp(22px, 3vw, 32px)',
                color: 'var(--white)',
                lineHeight: 1,
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
                <div key={entry.id} style={{
                  background: 'var(--off-black)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'border-color 300ms ease',
                }}>
                  {/* Photo or styled placeholder */}
                  {entry.photo_url ? (
                    <div style={{ position: 'relative', aspectRatio: '3/2', flexShrink: 0 }}>
                      <Image
                        src={entry.photo_url}
                        alt={entry.event_name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      aspectRatio: '3/2',
                      background: 'linear-gradient(135deg, rgba(155,93,229,0.12) 0%, rgba(8,8,10,1) 70%)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '20px',
                      flexShrink: 0,
                    }}>
                      <span style={{
                        fontFamily: 'Conthrax, sans-serif',
                        fontSize: 'clamp(16px, 2.5vw, 22px)',
                        color: 'rgba(250,248,243,0.18)',
                        lineHeight: 1.1,
                      }}>
                        {entry.event_name}
                      </span>
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

        {/* ── Full Archive — grouped by year ─────────────────────── */}
        <section style={{ marginBottom: '80px' }}>
          <div className="hardware-heading">
            <span className="section-label">Full Archive</span>
          </div>

          {allYears.map((year) => {
            const yearEntries = entries.filter((e) => e.year === year)
            return (
              <div
                key={year}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'clamp(60px, 8vw, 96px) 1fr',
                  gap: '0 32px',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '32px',
                  paddingBottom: '32px',
                  alignItems: 'start',
                }}
              >
                {/* Year label */}
                <div style={{
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: 'clamp(24px, 3.5vw, 40px)',
                  color: 'rgba(250,248,243,0.12)',
                  lineHeight: 1,
                  paddingTop: '4px',
                  position: 'sticky',
                  top: '88px',
                }}>
                  {year}
                </div>

                {/* Events list */}
                <div style={{ display: 'grid', gap: '0' }}>
                  {yearEntries.map((entry, i) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '13px 0',
                        borderBottom: i < yearEntries.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: 'clamp(13px, 1.8vw, 15px)',
                          color: entry.featured ? 'var(--white)' : 'rgba(250,248,243,0.82)',
                          fontWeight: entry.featured ? 500 : 300,
                          marginBottom: entry.tags.length ? '6px' : 0,
                          lineHeight: 1.4,
                        }}>
                          {entry.event_name}
                          {entry.featured && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '8px',
                              letterSpacing: '0.2em',
                              textTransform: 'uppercase',
                              color: 'var(--violet)',
                              verticalAlign: 'middle',
                            }}>
                              ★
                            </span>
                          )}
                        </div>
                        {entry.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {entry.tags.slice(0, 2).map((tag) => (
                              <TagChip key={tag} label={tag} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{entry.city}</div>
                        {entry.venue && (
                          <div style={{ fontSize: '10px', color: 'rgba(250,248,243,0.35)', marginTop: '2px' }}>
                            {entry.venue}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{
          borderTop: '1px solid var(--border)',
          padding: '56px 0 80px',
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
            Club nights, private events, festivals — the format is yours.
          </p>
          <Link href="/book" className="btn-primary">Start a Booking →</Link>
        </section>

      </div>
    </div>
  )
}
