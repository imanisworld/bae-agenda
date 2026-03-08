import Link from 'next/link'
import { getFeaturedMixes } from '@/lib/db/mixes'

const PLACEHOLDER_MIXES = [
  { id: '1', genre: 'Hip-Hop · Drill', title: 'Street Archives Vol. 1', durationLabel: '58 min', yearLabel: '2025', accentColor: 'var(--violet)' },
  { id: '2', genre: 'R&B · Neo Soul', title: 'After Hours', durationLabel: '72 min', yearLabel: '2025', accentColor: 'var(--gold)' },
  { id: '3', genre: 'Afrobeats · Dancehall', title: 'World Tour', durationLabel: '64 min', yearLabel: '2024', accentColor: 'var(--violet)' },
] as const

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const mins = Math.round(seconds / 60)
  return `${mins} min`
}

function getYearLabel(publishedAt: string | null): string {
  if (!publishedAt) return '—'
  const d = new Date(publishedAt)
  if (Number.isNaN(d.getTime())) return '—'
  return String(d.getFullYear())
}

function accentForIndex(i: number): string {
  return i % 2 === 0 ? 'var(--violet)' : 'var(--gold)'
}

function MixCard({
  genre,
  title,
  durationLabel,
  yearLabel,
  accentColor,
  href,
}: {
  genre: string
  title: string
  durationLabel: string
  yearLabel: string
  accentColor: string
  href?: string | null
}) {
  const CardBody = (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: accentColor,
          opacity: 0.5,
        }}
      />

      <span
        style={{
          fontSize: '9px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: accentColor,
          fontWeight: 500,
        }}
      >
        {genre}
      </span>

      <h3
        style={{
          fontFamily: 'Conthrax, sans-serif',
          fontSize: 'clamp(16px, 2vw, 22px)',
          fontWeight: 600,
          color: 'var(--white)',
          letterSpacing: '0.03em',
          lineHeight: 1.2,
          flex: 1,
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>{durationLabel}</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>{yearLabel}</span>
      </div>
    </>
  )

  const sharedStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
    overflow: 'hidden',
    textDecoration: 'none',
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="card-hover" style={sharedStyle}>
        {CardBody}
      </a>
    )
  }

  return (
    <article className="card-hover" style={sharedStyle}>
      {CardBody}
    </article>
  )
}

export default async function MixesSection() {
  const mixes = await getFeaturedMixes(3)
  const hasLiveData = mixes.length > 0

  return (
    <section
      id="mixes"
      aria-label="Featured Mixes"
      style={{
        background: 'var(--off-black)',
        position: 'relative',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="section-container">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
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
            <h2 className="section-heading" style={{ marginBottom: 0 }}>
              Latest Drops
            </h2>
          </div>
          <Link href="/mixes" className="view-all-link" style={{ marginBottom: '10px' }}>
            View All Mixes →
          </Link>
        </div>

        <div aria-hidden="true" style={{ height: '1px', background: 'var(--border)', margin: '32px 0 48px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {hasLiveData
            ? mixes.map((mix, i) => (
                <MixCard
                  key={mix.id}
                  genre={mix.genre ?? 'Open Format'}
                  title={mix.title}
                  durationLabel={formatDuration(mix.duration)}
                  yearLabel={getYearLabel(mix.published_at)}
                  accentColor={accentForIndex(i)}
                  href={mix.embed_url}
                />
              ))
            : PLACEHOLDER_MIXES.map((mix) => (
                <MixCard
                  key={mix.id}
                  genre={mix.genre}
                  title={mix.title}
                  durationLabel={mix.durationLabel}
                  yearLabel={mix.yearLabel}
                  accentColor={mix.accentColor}
                />
              ))}
        </div>
      </div>
    </section>
  )
}
