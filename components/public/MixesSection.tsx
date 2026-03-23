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
      <div className="section-container" style={{ position: 'relative', zIndex: 2 }}>

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
                Featured Mixes
              </span>
            </div>
            <h2 className="section-heading" style={{ marginBottom: 0 }}>
              Recent Sets
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
              <div style={{
                gridColumn: '1 / -1',
                padding: '48px 24px',
                border: '1px solid var(--border)',
                display: 'grid',
                justifyItems: 'center',
                gap: '18px',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg-sunken)',
              }}>
                {/* il_ background */}
                <div aria-hidden="true" style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'url(/photos/il_1588xN.5427428475_1wum.avif)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(1px) saturate(0.5) brightness(0.28)',
                  transform: 'scale(1.06)',
                  opacity: 1,
                }} />
                {/* Spinning CD video */}
                <div style={{
                  position: 'relative',
                  width: 'min(160px, 42vw)',
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  zIndex: 1,
                }}>
                  <video
                    src="/videos/e67f0964-8763-4658-bbba-4cc322727d68.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                </div>
                <div style={{
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: 'clamp(18px, 3vw, 28px)',
                  color: 'rgba(250,248,243,0.5)',
                  letterSpacing: '0.08em',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  Coming Soon
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, maxWidth: '360px', textAlign: 'center', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
                  New sets dropping soon. Follow to get notified.
                </p>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <a href={SOUNDCLOUD_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '12px' }}>
                    Follow on SoundCloud →
                  </a>
                </div>
              </div>
            )}
        </div>

      </div>
    </section>
  )
}
