import Link from 'next/link'
import { getFeaturedMixes } from '@/lib/db/mixes'

// ── Types ─────────────────────────────────────────────────────────────────────

type DataGenre = 'hiphop' | 'rnb' | 'afro'

// ── Per-genre linear gradients (matches static site exactly) ──────────────────

const CARD_GRADIENTS: Record<DataGenre, string> = {
  hiphop: 'linear-gradient(135deg, #1a0a2e 0%, #0f0a1a 100%)',
  rnb:    'linear-gradient(135deg, #1a1200 0%, #0f0e05 100%)',
  afro:   'linear-gradient(135deg, #0a1a1a 0%, #050f0f 100%)',
}

// ── Placeholder data (shown when no mixes in DB) ──────────────────────────────

const PLACEHOLDER_MIXES: Array<{
  id:          string
  genre:       string
  title:       string
  durationMin: number | null
  year:        number | null
  href:        string | null
  dataGenre:   DataGenre
}> = [
  { id: '1', genre: 'Hip-Hop · Drill',      title: 'Street Archives Vol. 1', durationMin: null, year: null, href: null, dataGenre: 'hiphop' },
  { id: '2', genre: 'R&B · Neo Soul',        title: 'After Hours',            durationMin: 72,   year: 2025, href: null, dataGenre: 'rnb'    },
  { id: '3', genre: 'Afrobeats · Dancehall', title: 'World Tour',             durationMin: null, year: null, href: null, dataGenre: 'afro'   },
]

const SOUNDCLOUD_PROFILE_URL = 'https://soundcloud.com/deejaybae'

// ── Helpers ───────────────────────────────────────────────────────────────────

function genreToDataAttr(genre: string): DataGenre {
  const g = genre.toLowerCase()
  if (g.includes('hip') || g.includes('drill') || g.includes('rap') || g.includes('trap')) return 'hiphop'
  if (g.includes('r&b') || g.includes('rnb') || g.includes('soul') || g.includes('neo'))   return 'rnb'
  return 'afro'
}

// ── MixCard ───────────────────────────────────────────────────────────────────

function MixCard({
  genre,
  title,
  href,
  dataGenre,
  durationMin,
  year,
}: {
  genre:       string
  title:       string
  href?:       string | null
  dataGenre:   DataGenre
  durationMin: number | null
  year:        number | null
}) {
  const bg      = CARD_GRADIENTS[dataGenre]
  const hasMeta = durationMin !== null || year !== null

  const inner = (
    <>
      {/* Background gradient layer */}
      <div className="mc-bg" style={{ background: bg }} />

      {/* Bottom-to-top dark overlay */}
      <div className="mc-overlay" />

      {/* Transport button stack — CDJ-inspired overlay */}
      <div aria-hidden="true" className="mc-play">
        <span className="mc-play-main">
          <span className="mc-play-icon" />
        </span>
      </div>

      {/* Content pinned to bottom — slides up slightly on hover */}
      <div className="mc-content">
        <p className="mc-genre">{genre}</p>
        <h3 className="mc-title">{title}</h3>

        {hasMeta && (
          <div className="mc-meta">
            {durationMin !== null && <span>{durationMin} min</span>}
            {durationMin !== null && year !== null && <span>·</span>}
            {year !== null && <span>{year}</span>}
            <span aria-hidden="true" className="mc-eq">
              <span className="mc-eq-bar" />
              <span className="mc-eq-bar" />
              <span className="mc-eq-bar" />
              <span className="mc-eq-bar" />
              <span className="mc-eq-bar" />
            </span>
          </div>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mc-card"
        data-genre={dataGenre}
      >
        {inner}
      </a>
    )
  }

  return (
    <article className="mc-card" data-genre={dataGenre}>
      {inner}
    </article>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export default async function MixesSection() {
  const mixes       = await getFeaturedMixes(3)
  const hasLiveData = false // flip to: mixes.length > 0  when real sets are ready

  return (
    <section
      id="mixes"
      aria-label="Featured Mixes"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(155,93,229,0.07) 0%, transparent 60%), var(--off-black)',
        position:   'relative',
        borderTop:  '1px solid var(--border)',
      }}
    >
      <div className="section-container">

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            {/* "— FEATURED MIXES" eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ width: '22px', height: '1px', background: 'var(--violet)', display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '10px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {hasLiveData ? 'Featured Mixes' : 'Coming Soon'}
              </span>
            </div>
            <h2 className="section-heading" style={{ marginBottom: 0 }}>
              {hasLiveData ? 'Recent Sets' : 'Coming Soon'}
            </h2>
          </div>
          {hasLiveData ? (
            <Link href="/mixes" className="view-all-link" style={{ marginBottom: '10px' }}>
              View All Mixes →
            </Link>
          ) : null}
        </div>

        <div aria-hidden="true" style={{ height: '1px', background: 'var(--border)', margin: '32px 0 48px' }} />

        {/* 3-column grid, 2px gap — matches static site */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '2px' }}>
          {hasLiveData
            ? mixes.map((mix) => {
                const dg          = genreToDataAttr(mix.genre ?? '')
                const durationMin = mix.duration ? Math.round(mix.duration / 60) : null
                const year        = mix.published_at ? new Date(mix.published_at).getFullYear() : null
                return (
                  <MixCard
                    key={mix.id}
                    genre={mix.genre ?? 'Open Format'}
                    title={mix.title}
                    href={mix.embed_url ?? SOUNDCLOUD_PROFILE_URL}
                    dataGenre={dg}
                    durationMin={durationMin}
                    year={year}
                  />
                )
              })
            : (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* 2×2 format cards grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
                  gap: '2px',
                }}>

                  {/* Vinyl card */}
                  <div className="format-card">
                    <div className="format-card-art">
                      <div className="vinyl-grooves">
                        <span className="vinyl-groove vinyl-groove-1" />
                        <span className="vinyl-groove vinyl-groove-2" />
                        <span className="vinyl-groove vinyl-groove-3" />
                        <span className="vinyl-groove vinyl-groove-4" />
                        <span className="vinyl-groove vinyl-groove-5" />
                        <span className="vinyl-groove vinyl-groove-6" />
                        <span className="vinyl-groove vinyl-groove-7" />
                        <div className="vinyl-label">
                          <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
                            <defs>
                              <path id="vinyl-text-path" d="M 50,50 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0" />
                            </defs>
                            <text fill="rgba(155,93,229,0.8)" fontSize="7" fontFamily="Conthrax, sans-serif" letterSpacing="3">
                              <textPath href="#vinyl-text-path">DJ B.A.E. · DJ B.A.E. ·</textPath>
                            </text>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <span className="format-card-label">Vinyl</span>
                  </div>

                  {/* Cassette card */}
                  <div className="format-card">
                    <div className="format-card-art">
                      <div style={{
                        width: 'min(130px, 26vw)',
                        padding: '14px 16px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '4px',
                        background: '#0d0d0f',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}>
                        {/* Reels row */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                          {[0, 1].map((i) => (
                            <div key={i} style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              border: '1px solid rgba(255,255,255,0.18)',
                              background: 'rgba(255,255,255,0.03)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: 'rgba(0,0,0,0.5)',
                              }} />
                            </div>
                          ))}
                        </div>
                        {/* Tape window */}
                        <div style={{
                          height: '8px',
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '2px',
                        }} />
                      </div>
                    </div>
                    <span className="format-card-label">Cassette</span>
                  </div>

                  {/* CD card */}
                  <div className="format-card">
                    <div className="format-card-art">
                      <div style={{
                        position: 'relative',
                        width: 'min(110px, 22vw)',
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, rgba(155,93,229,0.15), rgba(255,255,255,0.05), rgba(201,168,76,0.1), rgba(155,93,229,0.15))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {/* SVG circular text */}
                        <svg
                          viewBox="0 0 100 100"
                          width="100%"
                          height="100%"
                          style={{ position: 'absolute', inset: 0 }}
                          aria-hidden="true"
                        >
                          <defs>
                            <path id="cd-text-path" d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
                          </defs>
                          <text fill="rgba(155,93,229,0.8)" fontSize="7" fontFamily="Conthrax, sans-serif" letterSpacing="3">
                            <textPath href="#cd-text-path">DJ B.A.E. · DJ B.A.E. ·</textPath>
                          </text>
                        </svg>
                        {/* Center hole */}
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: '#0d0d0f',
                          border: '1px solid rgba(255,255,255,0.2)',
                          zIndex: 1,
                        }} />
                      </div>
                    </div>
                    <span className="format-card-label">CD</span>
                  </div>

                  {/* Waveform / Digital card */}
                  <div className="format-card">
                    <div className="format-card-art">
                      <div className="waveform-bars" aria-hidden="true">
                        {[4,8,14,20,28,32,28,22,16,10,6,4,8,16,24,30,24,18,12,8,6,4,8,12].map((h, i) => (
                          <div key={i} className="waveform-bar" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                    </div>
                    <span className="format-card-label">MP3 / Digital</span>
                  </div>

                </div>

                {/* Coming soon text + CTA row */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(16px, 2.5vw, 24px)',
                    color: 'rgba(250,248,243,0.18)',
                    letterSpacing: '0.08em',
                  }}>
                    Coming Soon
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, maxWidth: '360px', textAlign: 'center', lineHeight: 1.7 }}>
                    New sets dropping soon. Follow to get notified.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                      href={SOUNDCLOUD_PROFILE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ fontSize: '12px' }}
                    >
                      SC Follow →
                    </a>
                    <a
                      href="https://www.youtube.com/@djb.a.e"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ fontSize: '12px' }}
                    >
                      YT Subscribe →
                    </a>
                  </div>
                </div>

              </div>
            )}
        </div>

      </div>
    </section>
  )
}
