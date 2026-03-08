/**
 * MIXES PAGE — /mixes
 * Featured mix cards. Currently shows placeholder data.
 * Phase 3: replace PLACEHOLDER_MIXES with live query from mixes table.
 * Server Component — no client JS needed.
 */
import type { Metadata } from 'next'
import Link              from 'next/link'

export const metadata: Metadata = {
  title: 'Mixes — DJ B.A.E.',
  description: 'Curated DJ mixes across hip-hop, R&B, Afrobeats, house, and more by DJ B.A.E.',
}

const PLACEHOLDER_MIXES = [
  {
    id: '1',
    genre:       'Hip-Hop · Drill',
    title:       'Street Archives Vol. 1',
    duration:    '58 min',
    year:        '2025',
    description: 'Chicago drill and hip-hop essentials, mixed live.',
    accentColor: 'var(--violet)',
  },
  {
    id: '2',
    genre:       'R&B · Neo Soul',
    title:       'After Hours',
    duration:    '72 min',
    year:        '2025',
    description: 'Late-night R&B from the classics to now.',
    accentColor: 'var(--gold)',
  },
  {
    id: '3',
    genre:       'Afrobeats · Dancehall',
    title:       'World Tour',
    duration:    '64 min',
    year:        '2024',
    description: 'Global rhythms and movement-forward energy.',
    accentColor: 'var(--violet)',
  },
  {
    id: '4',
    genre:       'House · Electronic',
    title:       'The Frequency',
    duration:    '81 min',
    year:        '2024',
    description: 'Deep house and driving electronic for late nights.',
    accentColor: 'var(--gold)',
  },
  {
    id: '5',
    genre:       'Hip-Hop · R&B',
    title:       'Sunday Drive Vol. 2',
    duration:    '55 min',
    year:        '2024',
    description: 'Easy hip-hop and smooth R&B for the afternoon.',
    accentColor: 'var(--violet)',
  },
  {
    id: '6',
    genre:       'Afrobeats · Amapiano',
    title:       'Diaspora Sound',
    duration:    '67 min',
    year:        '2023',
    description: 'Afrobeats, amapiano, and Afro house across the continent.',
    accentColor: 'var(--gold)',
  },
] as const

export default function MixesPage() {
  return (
    <div style={{
      background: 'var(--off-black)',
      minHeight: '100vh',
      paddingTop: '120px',
    }}>
      <div className="section-container">

        {/* Header */}
        <div style={{ marginBottom: '56px' }}>
          <span className="section-label" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
          }}>
            Featured Mixes
            <span className="eq-bars" aria-hidden="true">
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
              <span className="eq-bar" />
            </span>
          </span>
          <h1 style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(32px, 5vw, 60px)',
            fontWeight: 600,
            color: 'var(--white)',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            margin: '12px 0 20px',
          }}>
            The Catalog
            <span style={{ color: 'var(--gold)' }}>.</span>
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--muted)',
            lineHeight: 1.7,
            maxWidth: '480px',
          }}>
            Every mix is a set. Find your frequency.
          </p>
        </div>

        {/* Divider */}
        <div aria-hidden="true" style={{
          height: '1px',
          background: 'var(--border)',
          marginBottom: '48px',
        }} />

        {/* Mix grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '64px',
        }}>
          {PLACEHOLDER_MIXES.map((mix) => (
            <article
              key={mix.id}
              className="card-hover"
              style={{
                background:     'var(--surface)',
                border:         '1px solid var(--border)',
                padding:        '32px',
                display:        'flex',
                flexDirection:  'column',
                gap:            '16px',
                position:       'relative',
                overflow:       'hidden',
              }}
            >
              {/* Accent bar */}
              <div aria-hidden="true" style={{
                position:   'absolute',
                top: 0, left: 0, right: 0,
                height:     '2px',
                background: mix.accentColor,
                opacity:    0.5,
              }} />

              <span style={{
                fontSize:       '9px',
                letterSpacing:  '0.25em',
                textTransform:  'uppercase',
                color:          mix.accentColor,
                fontWeight:     500,
              }}>
                {mix.genre}
              </span>

              <h2 style={{
                fontFamily:     'Conthrax, sans-serif',
                fontSize:       'clamp(16px, 2vw, 22px)',
                fontWeight:     600,
                color:          'var(--white)',
                letterSpacing:  '0.03em',
                lineHeight:     1.2,
                flex:           1,
              }}>
                {mix.title}
              </h2>

              <p style={{
                fontSize:   '12px',
                color:      'var(--muted)',
                lineHeight: 1.6,
              }}>
                {mix.description}
              </p>

              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                paddingTop:     '16px',
                borderTop:      '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                  {mix.duration}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>
                  {mix.year}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* SoundCloud CTA */}
        <div style={{
          borderTop:  '1px solid var(--border)',
          paddingTop: '48px',
          paddingBottom: '32px',
          display:    'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap:        '20px',
        }}>
          <p style={{
            fontSize:   '13px',
            color:      'var(--muted)',
            lineHeight: 1.7,
          }}>
            Find the full catalog on SoundCloud.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href="https://soundcloud.com/djbae"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Listen on SoundCloud
            </a>
            <Link href="/#booking" className="btn-ghost">
              Book a Set <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
