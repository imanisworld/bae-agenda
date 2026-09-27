import Image from 'next/image'
import InteractiveMediaDisc from '@/components/public/InteractiveMediaDisc'
import MixesTeaserForm from '@/components/public/MixesTeaserForm'
import type { Mix } from '@/lib/db/mixes'

const SOUNDCLOUD_PROFILE_URL = 'https://soundcloud.com/deejaybae'
const YOUTUBE_PROFILE_URL = 'https://www.youtube.com/@djb.a.e'

interface Props {
  sectionId?: string
  variant?: 'teaser' | 'page'
  mixes?: Mix[]
}

function formatDuration(durationSeconds: number | null) {
  if (!durationSeconds || durationSeconds <= 0) return 'Duration TBA'

  const hours = Math.floor(durationSeconds / 3600)
  const minutes = Math.floor((durationSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`
  }

  return `${minutes}m`
}

function formatPublishedDate(value: string | null) {
  if (!value) return 'Unreleased'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unreleased'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

// Stored links are often plain page URLs (e.g. soundcloud.com/artist/track), which
// refuse to render inside an iframe — convert them to real embed player URLs.
function toEmbedSrc(embedUrl: string) {
  const normalized = embedUrl.toLowerCase()

  if (normalized.includes('w.soundcloud.com/player') || normalized.includes('/embed/')) {
    return embedUrl
  }

  if (normalized.includes('soundcloud.com')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(embedUrl)}&color=%239b5de5&auto_play=false&hide_related=true&show_comments=false&visual=true`
  }

  const youtubeMatch = embedUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i
  )
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  return embedUrl
}

function getPlatformLabel(embedUrl: string | null) {
  if (!embedUrl) return 'Listen'

  const normalized = embedUrl.toLowerCase()
  if (normalized.includes('soundcloud')) return 'SoundCloud'
  if (normalized.includes('youtube') || normalized.includes('youtu.be')) return 'YouTube'
  return 'Listen'
}

export default function MixesSection({ sectionId = 'lab', variant = 'teaser', mixes = [] }: Props) {
  const isPage = variant === 'page'
  const hasPublishedMixes = mixes.length > 0
  const featuredMix = mixes[0] ?? null
  const archiveMixes = mixes.slice(1)
  const totalRuntimeHours = Math.round(
    mixes.reduce((sum, mix) => sum + (mix.duration ?? 0), 0) / 3600
  )
  const uniqueGenres = new Set(mixes.map((mix) => mix.genre?.trim()).filter(Boolean)).size

  return (
    <section
      id={sectionId}
      aria-label="Mixes and sets"
      style={{
        background: 'var(--off-black)',
        position:   'relative',
        borderTop:  '1px solid var(--border)',
      }}
    >
      <div
        className="section-container"
        style={{
          position: 'relative',
          zIndex: 2,
          paddingTop: isPage ? '72px' : '40px',
          paddingBottom: isPage ? '72px' : '32px',
        }}
      >
        {isPage ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ width: '22px', height: '1px', background: 'var(--violet)', display: 'block', flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Lab
                  </span>
                </div>
                <h1 className="section-heading" style={{ marginBottom: 0 }}>
                  Mixes &amp; Sets
                </h1>
                <p style={{
                  marginTop: '16px',
                  maxWidth: '640px',
                  fontSize: '15px',
                  lineHeight: 1.75,
                  color: 'var(--muted)',
                }}>
                  Mixes, live recordings, and archive sets in one place.
                </p>
              </div>
            </div>

            <div aria-hidden="true" style={{ height: '1px', background: 'var(--border)', margin: '32px 0 36px' }} />
          </>
        ) : null}

        {isPage && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '32px',
          }}>
            {[
              { label: 'Mixes', value: hasPublishedMixes ? String(mixes.length) : '—' },
              { label: 'Runtime', value: totalRuntimeHours > 0 ? `${totalRuntimeHours}h+` : '—' },
              { label: 'Genres', value: uniqueGenres > 0 ? String(uniqueGenres) : '—' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(12,12,16,0.54)',
                  padding: '14px 16px',
                  display: 'grid',
                  gap: '6px',
                }}
              >
                <div style={{
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: 'clamp(16px, 2vw, 22px)',
                  lineHeight: 1.1,
                  color: 'var(--white)',
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '2px' }}>
          <div
            className={`mixes-teaser-shell${isPage ? ' is-page' : ' is-teaser'}`}
            style={{ gridColumn: '1 / -1' }}
          >
            <InteractiveMediaDisc
              className="mixes-teaser-disc-button"
              imageSrc="/photos/images/logo.JPG"
            />

            <div className="mixes-teaser-copy">
              <div className="mixes-teaser-kicker">{isPage ? 'Updates' : 'Latest'}</div>
              <h2 className="mixes-teaser-title">{isPage ? 'Latest from DJ B.A.E.' : 'Mixes & Sets'}</h2>
              <p className="mixes-teaser-subtext">
                {isPage
                  ? 'Live recordings, mixes, and archive sets, with new uploads added as they are published.'
                  : 'Recent mixes and live recordings.'}
              </p>

              <MixesTeaserForm />

              <div className="mixes-teaser-follow">
                <div className="mixes-teaser-follow-label">Listen on</div>
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

              {isPage && (
                <div style={{
                  width: 'min(100%, 560px)',
                  marginTop: '6px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: 'var(--muted)',
                }}>
                  New uploads are published to SoundCloud and YouTube.
                </div>
              )}

            </div>
          </div>
        </div>

        {isPage ? (
          hasPublishedMixes && featuredMix ? (
            <div style={{ display: 'grid', gap: '24px', marginTop: '28px' }}>
              <div className="hardware-heading">
                <span className="section-label">Archive</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.9fr)',
                  gap: '18px',
                }}
              >
                <div
                  className="build-console"
                  style={{
                    padding: '18px',
                    borderRadius: '28px',
                    background: 'linear-gradient(180deg, rgba(155,93,229,0.08), rgba(12,12,16,0.96))',
                  }}
                >
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                          Featured Mix
                        </div>
                        <h3
                          style={{
                            margin: '8px 0 0',
                            fontFamily: 'Conthrax, sans-serif',
                            fontSize: 'clamp(24px, 3vw, 34px)',
                            lineHeight: 1.05,
                            color: 'var(--white)',
                          }}
                        >
                          {featuredMix.title}
                        </h3>
                      </div>

                      <div className="build-console-mini-chips">
                        <span>{formatPublishedDate(featuredMix.published_at)}</span>
                        <span>{formatDuration(featuredMix.duration)}</span>
                        <span>{featuredMix.genre || 'Open Format'}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(8,8,10,0.65)',
                        minHeight: '320px',
                      }}
                    >
                      {featuredMix.embed_url ? (
                        <iframe
                          title={`${featuredMix.title} player`}
                          src={toEmbedSrc(featuredMix.embed_url)}
                          loading="lazy"
                          allow="autoplay; encrypted-media; picture-in-picture"
                          style={{ width: '100%', minHeight: '320px', border: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            minHeight: '320px',
                            display: 'grid',
                            placeItems: 'center',
                            padding: '24px',
                            textAlign: 'center',
                            color: 'var(--muted)',
                          }}
                        >
                          Player link coming soon for this mix.
                        </div>
                      )}
                    </div>

                    {featuredMix.description ? (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: 1.8,
                          color: 'rgba(250,248,243,0.78)',
                        }}
                      >
                        {featuredMix.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: '12px',
                    alignContent: 'start',
                  }}
                >
                  <div
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(12,12,16,0.58)',
                      padding: '16px 18px',
                      display: 'grid',
                      gap: '10px',
                    }}
                  >
                    <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                      About
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--white)' }}>
                      Live recordings, mixes, and edits from the current archive.
                    </div>
                  </div>

                  <div
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(12,12,16,0.58)',
                      padding: '16px 18px',
                      display: 'grid',
                      gap: '10px',
                    }}
                  >
                    <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                      Listen on
                    </div>
                    <div className="mixes-teaser-follow-grid">
                      <a href={SOUNDCLOUD_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="mixes-teaser-platform">
                        <span className="mixes-teaser-platform-tag">SC</span>
                        <span>SoundCloud</span>
                      </a>
                      <a href={YOUTUBE_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="mixes-teaser-platform">
                        <span className="mixes-teaser-platform-tag">YT</span>
                        <span>YouTube</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'Conthrax, sans-serif',
                      fontSize: 'clamp(18px, 2.2vw, 28px)',
                      color: 'var(--white)',
                    }}
                  >
                    More Mixes
                  </h3>
                  <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {archiveMixes.length > 0 ? `${archiveMixes.length} more` : 'Latest mix'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {mixes.map((mix) => (
                    <article
                      key={mix.id}
                      className="card-hover"
                      style={{
                        display: 'grid',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '20px',
                        background: 'linear-gradient(180deg, rgba(20,20,24,0.96), rgba(12,12,16,0.98))',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {mix.cover_url ? (
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1 / 1',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <Image
                            src={mix.cover_url}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, 220px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      ) : null}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                          {mix === featuredMix ? 'Featured' : formatPublishedDate(mix.published_at)}
                        </span>
                        <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(155,93,229,0.9)' }}>
                          {getPlatformLabel(mix.embed_url)}
                        </span>
                      </div>

                      <div>
                        <h4 style={{ margin: 0, fontSize: '18px', lineHeight: 1.3, color: 'var(--white)' }}>
                          {mix.title}
                        </h4>
                        <div style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.7, color: 'var(--muted)' }}>
                          {[mix.genre || 'Open Format', formatDuration(mix.duration)].join(' · ')}
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'rgba(250,248,243,0.72)' }}>
                        {mix.description?.trim() || 'Archive drop from the current rotation.'}
                      </p>

                      {mix.embed_url ? (
                        <a
                          href={mix.embed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            justifySelf: 'start',
                            padding: '11px 14px',
                            border: '1px solid rgba(155,93,229,0.32)',
                            background: 'rgba(155,93,229,0.12)',
                            color: 'var(--white)',
                            textDecoration: 'none',
                            fontSize: '10px',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Listen
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="build-console"
              style={{
                marginTop: '28px',
                padding: '18px',
                borderRadius: '24px',
                background: 'linear-gradient(180deg, rgba(155,93,229,0.06), rgba(12,12,16,0.96))',
              }}
            >
              <div style={{ display: 'grid', gap: '10px', maxWidth: '620px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Archive
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(22px, 3vw, 34px)',
                    lineHeight: 1.05,
                    color: 'var(--white)',
                  }}
                >
                  New mixes will appear here.
                </h3>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.8, color: 'rgba(250,248,243,0.74)' }}>
                  Follow the channels above or join the notify list for new uploads.
                </p>
              </div>
            </div>
          )
        ) : null}
      </div>
    </section>
  )
}
