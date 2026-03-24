import Link from 'next/link'
import { getFeaturedMixes } from '@/lib/db/mixes'
import InteractiveMediaDisc from '@/components/public/InteractiveMediaDisc'
import MixesTeaserForm from '@/components/public/MixesTeaserForm'

// ── Types ─────────────────────────────────────────────────────────────────────

type DataGenre = 'hiphop' | 'rnb' | 'afro'

// ── Per-genre linear gradients (matches static site exactly) ──────────────────

const CARD_GRADIENTS: Record<DataGenre, string> = {
  hiphop: 'linear-gradient(135deg, #1a0a2e 0%, #0f0a1a 100%)',
  rnb:    'linear-gradient(135deg, #1a1200 0%, #0f0e05 100%)',
  afro:   'linear-gradient(135deg, #0a1a1a 0%, #050f0f 100%)',
}

const SOUNDCLOUD_PROFILE_URL = 'https://soundcloud.com/deejaybae'
const YOUTUBE_PROFILE_URL = 'https://www.youtube.com/@djb.a.e'

// ── Helpers ───────────────────────────────────────────────────────────────────

function genreToDataAttr(genre: string): DataGenre {
  const g = genre.toLowerCase()
  if (g.includes('hip') || g.includes('drill') || g.includes('rap') || g.includes('trap')) return 'hiphop'
  if (g.includes('r&b') || g.includes('rnb') || g.includes('soul') || g.includes('neo'))   return 'rnb'
  return 'afro'
}

function normalizeMixHref(href?: string | null) {
  if (!href) return SOUNDCLOUD_PROFILE_URL
  return href.replace('https://soundcloud.com/djbae', SOUNDCLOUD_PROFILE_URL)
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
                    href={normalizeMixHref(mix.embed_url)}
                    dataGenre={dg}
                    durationMin={durationMin}
                    year={year}
                  />
                )
              })
            : (
              <div className="mixes-teaser-shell" style={{ gridColumn: '1 / -1' }}>
                <div aria-hidden="true" className="mixes-teaser-noise" />
                <div aria-hidden="true" className="mixes-teaser-orbit mixes-teaser-orbit-a" />
                <div aria-hidden="true" className="mixes-teaser-orbit mixes-teaser-orbit-b" />

                <InteractiveMediaDisc
                  className="mixes-teaser-disc-button"
                  imageSrc="/photos/images/logo.JPG"
                />

                <div className="mixes-teaser-copy">
                  <div className="mixes-teaser-kicker">Mix Lab</div>
                  <h3 className="mixes-teaser-title">Bae&apos;s in the Lab</h3>
                  <p className="mixes-teaser-subtext">Be first to hear new sets.</p>

                  <MixesTeaserForm />

                  <div className="mixes-teaser-follow">
                    <div className="mixes-teaser-follow-label">Follow Everywhere</div>
                    <div className="mixes-teaser-follow-grid">
                      <a
                        href={SOUNDCLOUD_PROFILE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mixes-teaser-platform"
                      >
                        <span className="mixes-teaser-platform-tag">SC</span>
                        <span>SoundCloud</span>
                      </a>
                      <a
                        href={YOUTUBE_PROFILE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mixes-teaser-platform"
                      >
                        <span className="mixes-teaser-platform-tag">YT</span>
                        <span>YouTube</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

      </div>
    </section>
  )
}
