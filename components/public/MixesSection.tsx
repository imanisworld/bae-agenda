/**
 * MIXES SECTION — Server Component
 * Placeholder mix cards. Phase 3: replace with live Supabase data.
 * Hover states via CSS classes — no JS event handlers.
 */
import Link from 'next/link'

const PLACEHOLDER_MIXES = [
  { id: '1', genre: 'Hip-Hop · Drill',     title: 'Street Archives Vol. 1', duration: '58 min', year: '2025', accentColor: 'var(--violet)' },
  { id: '2', genre: 'R&B · Neo Soul',       title: 'After Hours',            duration: '72 min', year: '2025', accentColor: 'var(--gold)'   },
  { id: '3', genre: 'Afrobeats · Dancehall',title: 'World Tour',             duration: '64 min', year: '2024', accentColor: 'var(--violet)' },
] as const

function MixCard({ genre, title, duration, year, accentColor }: (typeof PLACEHOLDER_MIXES)[number]) {
  return (
    <article
      className="card-hover"
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        padding: '32px', display: 'flex', flexDirection: 'column',
        gap: '16px', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px', background: accentColor, opacity: 0.5,
      }} />

      <span style={{
        fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase',
        color: accentColor, fontWeight: 500,
      }}>
        {genre}
      </span>

      <h3 style={{
        fontFamily: 'Conthrax, sans-serif',
        fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 600,
        color: 'var(--white)', letterSpacing: '0.03em', lineHeight: 1.2, flex: 1,
      }}>
        {title}
      </h3>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: '16px', borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>{duration}</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>{year}</span>
      </div>
    </article>
  )
}

export default function MixesSection() {
  return (
    <section id="mixes" aria-label="Featured Mixes" style={{
      background: 'var(--off-black)', position: 'relative',
      borderTop: '1px solid var(--border)',
    }}>
      <div className="section-container">
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
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
            <h2 className="section-heading" style={{ marginBottom: 0 }}>Latest Drops</h2>
          </div>
          <Link href="/mixes" className="view-all-link" style={{ marginBottom: '10px' }}>
            View All Mixes →
          </Link>
        </div>

        <div aria-hidden="true" style={{ height: '1px', background: 'var(--border)', margin: '32px 0 48px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {PLACEHOLDER_MIXES.map((mix) => <MixCard key={mix.id} {...mix} />)}
        </div>
      </div>
    </section>
  )
}
