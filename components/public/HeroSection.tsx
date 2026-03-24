/**
 * HERO SECTION — Server Component
 * Full-viewport editorial layout:
 *   Top-left  — eyebrow + large Conthrax headline
 *   Top-right — date pill + short descriptor text
 *   Centre    — open void with ambient glow (HeroGlowLayer)
 *   Bottom    — reserved motion area above genre ticker
 */
import Image         from 'next/image'
import HeroGlowLayer from '@/components/effects/HeroGlowLayer'
import ScrollFader   from '@/components/public/ScrollFader'

interface HeroContent {
  hero_title?:    string
  hero_subtitle?: string
}

interface Props {
  content?: HeroContent
}

const GENRES = [
  'HOUSE',
  'GARAGE',
  'JUNGLE',
  'JUKE',
  'LOVERS ROCK',
  'BAILE',
  'BALLROOM',
  'MIAMI BASS',
  'ATL BASS',
  'LATIN',
  'LATIN HOUSE',
  'SOCA',
  'R&B',
  'HIP HOP',
]

export default function HeroSection({ content = {} }: Props) {
  const title      = content.hero_title?.trim() || 'THE BAE AGENDA'

  return (
    <section
      id="home"
      aria-label="DJ B.A.E. — The Bae Agenda"
      style={{
        position:      'relative',
        minHeight:     '100vh',
        background:    'var(--black)',
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Background photo ─────────────────────────────── */}
      <Image
        className="hero-bg-photo"
        src="/photos/images/outside.jpg"
        alt=""
        fill
        priority
        aria-hidden="true"
        style={{ objectFit: 'cover', objectPosition: 'center 48%', opacity: 0.6 }}
      />

      {/* Dark gradient overlay — keeps text readable */}
      <div aria-hidden="true" style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(to bottom, rgba(8,8,10,0.44) 0%, rgba(8,8,10,0.22) 34%, rgba(8,8,10,0.52) 72%, rgba(8,8,10,0.78) 100%)',
        zIndex:     0,
      }} className="hero-bg-overlay" />
      <div className="hero-bg-scan" aria-hidden="true" />

      {/* ── Effects ──────────────────────────────────────── */}
      <div className="noise-overlay" aria-hidden="true" />
      <HeroGlowLayer />
      <ScrollFader />

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="hero-topbar">
        {/* Left — eyebrow + headline */}
        <div className="hero-copy-stack" style={{ display: 'grid', gap: '10px' }}>
          <p className="hero-eyebrow" style={{
            fontFamily:    'DM Sans, sans-serif',
            fontSize:      'clamp(9px, 2.4vw, 11px)',
            letterSpacing: 'clamp(0.12em, 1.8vw, 0.28em)',
            textTransform: 'uppercase',
            color:         'var(--eyebrow)',
          }}>
            Chicago · DJ · Curator · <span style={{whiteSpace:'nowrap'}}>Experience Architect</span>
          </p>

          <h1 className="hero-title" style={{
            fontFamily:    'Conthrax, sans-serif',
            fontWeight:    600,
            fontSize:      'clamp(44px, 6.5vw, 100px)',
            lineHeight:    0.95,
            letterSpacing: '-0.01em',
            color:         'var(--white)',
            margin:        0,
          }}>
            {title.split(/\s+/).map((word, index, words) => (
              <span key={`${word}-${index}`} className="hero-title-word" style={{ color: word === 'BAE' ? '#a66bff' : undefined }}>
                {word}
                {index < words.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>

        </div>

        <div aria-hidden="true" />
      </div>

      {/* ── Centre void — glow fills this space ──────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Bottom — motion stage + genre band ─────────────── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Genre ticker */}
        <div className="genre-band" aria-hidden="true">
          <div className="genre-track">
            {[...GENRES, ...GENRES].map((genre, i) => (
              <span key={`${genre}-${i}`} className="genre-chip">
                {genre}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
