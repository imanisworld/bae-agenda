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
  const subtitle   = content.hero_subtitle    ?? 'Private events, club nights, weddings & branded experiences.'

  // Server-rendered — matches Farm Minerals date badge pattern
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day:   'numeric',
    year:  'numeric',
  })

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
        src="/photos/hero-bg.jpg"
        alt=""
        fill
        priority
        aria-hidden="true"
        style={{ objectFit: 'cover', objectPosition: 'center 35%', opacity: 0.45 }}
      />

      {/* Dark gradient overlay — keeps text readable */}
      <div aria-hidden="true" style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.92) 100%)',
        zIndex:     0,
      }} />

      {/* ── Effects ──────────────────────────────────────── */}
      <div className="noise-overlay" aria-hidden="true" />
      <HeroGlowLayer />

      {/* ── Top bar ──────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex:   1,
          display:  'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'flex-start',
          gap:      '40px',
          /* clear the fixed nav (68px) + breathing room */
          padding:  'calc(68px + 52px) clamp(32px, 5vw, 72px) 0',
        }}
      >
        {/* Left — eyebrow + headline */}
        <div>
          <p style={{
            fontFamily:    'DM Sans, sans-serif',
            fontSize:      'clamp(9px, 2.4vw, 11px)',
            letterSpacing: 'clamp(0.12em, 1.8vw, 0.28em)',
            textTransform: 'uppercase',
            color:         'var(--eyebrow)',
            marginBottom:  '22px',
          }}>
            Chicago · DJ · Curator · <span style={{whiteSpace:'nowrap'}}>Experience Architect</span>
          </p>

          <h1 style={{
            fontFamily:    'Conthrax, sans-serif',
            fontWeight:    600,
            fontSize:      'clamp(44px, 6.5vw, 100px)',
            lineHeight:    0.95,
            letterSpacing: '-0.01em',
            color:         'var(--white)',
            margin:        0,
          }}>
            {title.split(/\s+/).map((word, index, words) => (
              <span key={`${word}-${index}`} style={{ color: word === 'BAE' ? '#a66bff' : undefined }}>
                {word}
                {index < words.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
        </div>

        {/* Right — date pill + descriptor */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'flex-end',
          gap:           '20px',
        }}>
          {/* Date badge */}
          <div style={{
            display:       'inline-flex',
            alignItems:    'center',
            background:    'rgba(255,255,255,0.06)',
            border:        '1px solid rgba(255,255,255,0.12)',
            borderRadius:  '100px',
            padding:       '10px 22px',
            fontSize:      '13px',
            fontFamily:    'DM Sans, sans-serif',
            color:         'var(--white)',
            letterSpacing: '0.01em',
            whiteSpace:    'nowrap',
          }}>
            {today}
          </div>

          {/* Short descriptor */}
          <p style={{
            fontFamily:    'DM Sans, sans-serif',
            fontSize:      'clamp(13px, 1.5vw, 15px)',
            fontWeight:    500,
            letterSpacing: '0.03em',
            color:         'rgba(245,245,240,0.9)',
            lineHeight:    1.7,
            textAlign:     'right',
            maxWidth:      '340px',
            margin:        0,
            padding:       '16px 18px',
            border:        '1px solid rgba(255,255,255,0.12)',
            background:    'rgba(8,8,8,0.34)',
            backdropFilter:'blur(10px)',
            textShadow:    '0 1px 16px rgba(0,0,0,0.45)',
          }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* ── Centre void — glow fills this space ──────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Bottom — motion stage + genre band ─────────────── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          padding:        '0 clamp(32px, 5vw, 72px) 44px',
          display:        'flex',
          justifyContent: 'center',
        }}>
          <div
            className="hero-motion-stage"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: '132px',
            }}
          >
            <div className="hero-motion-rig" aria-hidden="true">
              <span className="hero-orbit hero-orbit-a" />
              <span className="hero-orbit hero-orbit-b" />
              <span className="hero-core" />
              <span className="hero-pulse-line hero-pulse-line-a" />
              <span className="hero-pulse-line hero-pulse-line-b" />
            </div>
          </div>
        </div>

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
