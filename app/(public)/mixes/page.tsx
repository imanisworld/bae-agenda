import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedMixes } from '@/lib/db/mixes'

const SOUNDCLOUD_PLAYLIST_URL = 'https://soundcloud.com/deejaybae/sets/mixes?si=057590d3680e4ebaba02a15c247b3e5a&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharin'
const SOUNDCLOUD_PLAYER_SRC = 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A1935343495&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true'
const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/watch?v=2wKqMdJD3ts&list=PLItuH_cM_7fHGhBnBFM6zZY5w5sas9HYh'
const YOUTUBE_EMBED_SRC = 'https://www.youtube.com/embed/2wKqMdJD3ts?list=PLItuH_cM_7fHGhBnBFM6zZY5w5sas9HYh'

export const metadata: Metadata = {
  title: 'Mixes — DJ B.A.E.',
  description: 'Curated DJ mixes across hip-hop, R&B, Afrobeats, house, and more by DJ B.A.E.',
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  return `${Math.round(seconds / 60)} min`
}

function formatYear(publishedAt: string | null): string {
  if (!publishedAt) return '—'
  const d = new Date(publishedAt)
  if (Number.isNaN(d.getTime())) return '—'
  return String(d.getFullYear())
}

function accentForIndex(i: number): string {
  return i % 2 === 0 ? 'var(--violet)' : 'var(--gold)'
}

export default async function MixesPage() {
  const mixes = await getPublishedMixes(60)

  return (
    <div
      style={{
        background: 'var(--off-black)',
        minHeight: '100vh',
        paddingTop: '120px',
      }}
    >
      <div className="section-container">
        <div style={{ marginBottom: '56px' }}>
          <span className="section-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            Featured Mixes
            <span className="eq-bars" aria-hidden="true">
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
            </span>
          </span>
          <h1
            style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(32px, 5vw, 60px)',
              fontWeight: 600,
              color: 'var(--white)',
              letterSpacing: '-0.01em',
              lineHeight: 1.05,
              margin: '12px 0 20px',
            }}
          >
            The Catalog
            <span style={{ color: 'var(--gold)' }}>.</span>
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--muted)',
              lineHeight: 1.7,
              maxWidth: '560px',
            }}
          >
            Every mix is a set. Find your frequency.
          </p>
        </div>

        <div aria-hidden="true" style={{ height: '1px', background: 'var(--border)', marginBottom: '48px' }} />

        <section
          style={{
            marginBottom: '40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          <article
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minHeight: '100%',
            }}
          >
            <div style={{ minHeight: '86px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--violet)', marginBottom: '8px' }}>
                SoundCloud
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Inline playlist for the main mix catalog.
              </p>
            </div>

            <div style={{ border: '1px solid var(--border)', background: '#111', overflow: 'hidden', minHeight: '300px' }}>
              <iframe
                title="DJ B.A.E. SoundCloud playlist"
                width="100%"
                height="300"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={SOUNDCLOUD_PLAYER_SRC}
                style={{ display: 'block' }}
              />
            </div>

            <a href={SOUNDCLOUD_PLAYLIST_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ justifyContent: 'center', marginTop: 'auto' }}>
              Open On SoundCloud
            </a>
          </article>

          <article
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minHeight: '100%',
            }}
          >
            <div style={{ minHeight: '86px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
                YouTube
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Featured video and playlist inline.
              </p>
            </div>

            <div style={{ border: '1px solid var(--border)', background: '#111', overflow: 'hidden', minHeight: '300px' }}>
              <iframe
                title="DJ B.A.E. YouTube playlist"
                width="100%"
                height="100%"
                src={YOUTUBE_EMBED_SRC}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ display: 'block', border: 0, width: '100%', minHeight: '300px' }}
              />
            </div>

            <a href={YOUTUBE_PLAYLIST_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ justifyContent: 'center', marginTop: 'auto' }}>
              Open On YouTube
            </a>
          </article>

          <article
            style={{
              border: '1px solid var(--border)',
              background: 'linear-gradient(180deg, rgba(155,93,229,0.08), rgba(255,255,255,0.01))',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minHeight: '100%',
            }}
          >
            <div style={{ minHeight: '86px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--eyebrow)', marginBottom: '8px' }}>
                Inline First
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Use the players here first, then open the platform only when you want comments, sharing, or the full catalog view.
              </p>
            </div>

            <div
              style={{
                border: '1px solid var(--border)',
                background: 'rgba(8,8,8,0.26)',
                minHeight: '300px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
              }}
            >
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  'Inline players stay on-brand and keep people in the site flow.',
                  'Platform links are there when someone wants the native app experience.',
                  'Booking CTA stays visible beside the media instead of below the fold.',
                ].map((point) => (
                  <div key={point} style={{ fontSize: '13px', color: 'var(--white)', lineHeight: 1.7, paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {point}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <a href={SOUNDCLOUD_PLAYLIST_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ justifyContent: 'center' }}>
                SoundCloud Catalog
                </a>
                <a href={YOUTUBE_PLAYLIST_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ justifyContent: 'center' }}>
                  YouTube Playlist
                </a>
                <Link href="/book" className="btn-primary" style={{ textAlign: 'center' }}>
                  Book a Set
                </Link>
              </div>
            </div>
          </article>
        </section>

        {mixes.length === 0 ? (
          <div style={{ padding: '64px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>
              No published mixes yet.
              <br />
              Check back soon or listen on SoundCloud.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '64px',
            }}
          >
            {mixes.map((mix, i) => (
              <article
                key={mix.id}
                className="card-hover"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: accentForIndex(i),
                    opacity: 0.5,
                  }}
                />

                <span
                  style={{
                    fontSize: '9px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: accentForIndex(i),
                    fontWeight: 500,
                  }}
                >
                  {mix.genre ?? 'Open Format'}
                </span>

                <h2
                  style={{
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(16px, 2vw, 22px)',
                    fontWeight: 600,
                    color: 'var(--white)',
                    letterSpacing: '0.03em',
                    lineHeight: 1.2,
                  }}
                >
                  {mix.title}
                </h2>

                {mix.description && (
                  <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>{mix.description}</p>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border)',
                    marginTop: 'auto',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                    {formatDuration(mix.duration)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                    {formatYear(mix.published_at)}
                  </span>
                </div>

                {mix.embed_url && (
                  <a href={mix.embed_url} target="_blank" rel="noopener noreferrer" className="pkg-btn">
                    Open On Platform
                  </a>
                )}
              </article>
            ))}
          </div>
        )}

        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '48px',
            paddingBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '20px',
          }}
        >
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>
            Find the full catalog on SoundCloud when you want the platform view.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a href="https://soundcloud.com/djbae" target="_blank" rel="noopener noreferrer" className="btn-primary">
              Open On SoundCloud
            </a>
            <Link href="/book" className="btn-ghost">
              Book a Set <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
