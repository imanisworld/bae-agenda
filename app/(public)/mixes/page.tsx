import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedMixes } from '@/lib/db/mixes'

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
                    Listen
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
            Find the full catalog on SoundCloud.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a href="https://soundcloud.com/djbae" target="_blank" rel="noopener noreferrer" className="btn-primary">
              Listen on SoundCloud
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
