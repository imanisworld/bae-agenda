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
import HeroDeck      from '@/components/public/HeroDeck'
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
        style={{ objectFit: 'cover', objectPosition: 'center 35%', opacity: 0.56 }}
      />

      {/* Dark gradient overlay — keeps text readable */}
      <div aria-hidden="true" style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(to bottom, rgba(8,8,10,0.38) 0%, rgba(8,8,10,0.22) 38%, rgba(8,8,10,0.56) 78%, rgba(8,8,10,0.76) 100%)',
        zIndex:     0,
      }} />

      {/* ── Effects ──────────────────────────────────────── */}
      <div className="noise-overlay" aria-hidden="true" />
      <HeroGlowLayer />
      <ScrollFader />

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="hero-topbar">
        {/* Left — eyebrow + headline */}
        <div style={{ display: 'grid', gap: '10px' }}>
          <p style={{
            fontFamily:    'DM Sans, sans-serif',
            fontSize:      'clamp(9px, 2.4vw, 11px)',
            letterSpacing: 'clamp(0.12em, 1.8vw, 0.28em)',
            textTransform: 'uppercase',
            color:         'var(--eyebrow)',
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

          <div style={{
            display:       'inline-flex',
            alignItems:    'center',
            justifySelf:   'start',
            width:         'fit-content',
            background:    'rgba(255,255,255,0.05)',
            border:        '1px solid rgba(255,255,255,0.14)',
            borderRadius:  '100px',
            padding:       '7px 16px',
            fontSize:      '11px',
            fontFamily:    'DM Sans, sans-serif',
            color:         'rgba(250,248,243,0.88)',
            letterSpacing: '0.01em',
            whiteSpace:    'nowrap',
            marginTop:     '14px',
          }}>
            {today}
          </div>
        </div>

        <div aria-hidden="true" />
      </div>

      {/* ── Centre void — glow fills this space ──────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Bottom — motion stage + genre band ─────────────── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-deck-stage-wrap">
          <div
            className="hero-motion-stage"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '100%',
              minHeight: '188px',
            }}
          >
            <HeroDeck />
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
