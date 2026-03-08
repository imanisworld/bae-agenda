/**
 * HERO SECTION — Server Component
 * Full-viewport editorial layout:
 *   Top-left  — eyebrow + large Conthrax headline
 *   Top-right — date pill + short descriptor text
 *   Centre    — open void with ambient glow (HeroGlowLayer)
 *   Bottom    — floating "Book Your Date" card above genre ticker
 */
import Link          from 'next/link'
import Image         from 'next/image'
import HeroGlowLayer from '@/components/effects/HeroGlowLayer'

interface HeroContent {
  hero_title?:         string
  hero_subtitle?:      string
  hero_cta_primary?:   string
  hero_cta_secondary?: string
}

interface Props {
  content?: HeroContent
}

const GENRES = ['HOUSE', 'DRILL', 'LATIN', 'TRAP', 'CLUB', 'HIP HOP', 'R&B', 'AFROBEATS']

export default function HeroSection({ content = {} }: Props) {
  const title      = content.hero_title?.trim() || 'THE BAE AGENDA'
  const subtitle   = content.hero_subtitle    ?? 'Private events, club nights, weddings & branded experiences.'
  const ctaPrimary = content.hero_cta_primary ?? 'Book Your Date'
  const ctaSecondary = content.hero_cta_secondary?.trim() || 'Listen To Mixes'

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
            fontSize:      '11px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color:         'var(--eyebrow)',
            marginBottom:  '22px',
          }}>
            Chicago&nbsp;·&nbsp;DJ&nbsp;·&nbsp;Curator&nbsp;·&nbsp;Experience Architect
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

      {/* ── Bottom — card + genre band ────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Booking card — centred */}
        <div style={{
          padding:        '0 clamp(32px, 5vw, 72px) 44px',
          display:        'flex',
          justifyContent: 'center',
        }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <Link
              href="/book"
              className="hero-book-card"
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                gap:            '52px',
                background:     'rgba(255,255,255,0.04)',
                border:         '1px solid rgba(255,255,255,0.1)',
                borderRadius:   '6px',
                padding:        '20px 24px',
                textDecoration: 'none',
                minWidth:       '340px',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div>
                <div style={{
                  fontFamily:    'Conthrax, sans-serif',
                  fontSize:      '13px',
                  fontWeight:    600,
                  letterSpacing: '0.06em',
                  color:         'var(--white)',
                  marginBottom:  '5px',
                }}>
                  {ctaPrimary}
                </div>
                <div style={{
                  fontFamily:    'DM Sans, sans-serif',
                  fontSize:      '11px',
                  color:         'var(--muted)',
                  letterSpacing: '0.02em',
                }}>
                  Inquiries open for 2026
                </div>
              </div>

              <div aria-hidden="true" style={{
                width:          '38px',
                height:         '38px',
                borderRadius:   '50%',
                border:         '1px solid rgba(155,93,229,0.45)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'var(--violet)',
                fontSize:       '17px',
                flexShrink:     0,
              }}>
                →
              </div>
            </Link>

            <Link
              href="/#mixes"
              className="hero-book-card"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 24px',
                minWidth: '220px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--white)',
                textDecoration: 'none',
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(16px)',
              }}
            >
              {ctaSecondary}
            </Link>
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
