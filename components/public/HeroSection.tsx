/**
 * HERO SECTION — Server Component
 * Split layout: photo collage (left 46%) + brand content (right 54%).
 * Hover states via CSS classes. Glow blobs in HeroGlowLayer (Client Component).
 *
 * PHOTO SLOTS — adding real photos:
 *   Replace each <div className="photo-placeholder"> with:
 *     <img src="/photos/hero-1.jpg" alt="..." />
 *   or a Next.js <Image> component.
 *   Recommended dimensions: Photo 1 (main): 900×1200 portrait
 *                           Photo 2 & 3:    600×400 landscape
 *
 * CMS: accepts optional hero copy overrides from site_content table.
 * Falls back to CONTENT_DEFAULTS so the site never breaks if CMS is empty.
 */
import Link          from 'next/link'
import HeroGlowLayer from '@/components/effects/HeroGlowLayer'
import { CONTENT_DEFAULTS } from '@/lib/content-schema'

interface HeroContent {
  hero_title?:         string
  hero_subtitle?:      string
  hero_cta_primary?:   string
  hero_cta_secondary?: string
}

interface Props {
  content?: HeroContent
}

export default function HeroSection({ content = {} }: Props) {
  const subtitle     = content.hero_subtitle      ?? CONTENT_DEFAULTS.hero_subtitle
  const ctaPrimary   = content.hero_cta_primary   ?? CONTENT_DEFAULTS.hero_cta_primary
  const ctaSecondary = content.hero_cta_secondary ?? CONTENT_DEFAULTS.hero_cta_secondary

  const customTitle = content.hero_title && content.hero_title !== CONTENT_DEFAULTS.hero_title
    ? content.hero_title
    : null

  const genres = ['HOUSE', 'DRILL', 'LATIN', 'TRAP', 'CLUB', 'HIP HOP', 'R&B', 'AFROBEATS']

  return (
    <section
      id="home"
      aria-label="DJ B.A.E. — The Bae Agenda"
      className="hero-split"
      style={{ position: 'relative', background: 'var(--black)' }}
    >

      {/* ── LEFT: Photo collage panel ──────────────────────── */}
      <div className="hero-photo-panel" aria-hidden="true">
        <div className="hero-photo-grid">

          <div className="hero-photo-main photo-slot">
            <div className="photo-art photo-art-1" />
          </div>

          <div className="hero-photo-2 photo-slot">
            <div className="photo-art photo-art-2" />
          </div>

          <div className="hero-photo-3 photo-slot">
            <div className="photo-art photo-art-3" />
          </div>

        </div>
      </div>

      {/* ── RIGHT: Brand content ───────────────────────────── */}
      <div style={{
        position:       'relative',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'flex-start',
        justifyContent: 'center',
        padding:        'clamp(80px, 10vh, 140px) clamp(32px, 5vw, 80px) clamp(80px, 10vh, 120px) clamp(32px, 4vw, 64px)',
        overflow:       'hidden',
      }}>

        <div className="noise-overlay" aria-hidden="true" />
        <HeroGlowLayer />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px', width: '100%' }}>

          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize:   '10px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color:      'var(--muted)',
            marginBottom: '32px',
          }}>
            Chicago&nbsp;·&nbsp;DJ&nbsp;·&nbsp;Curator&nbsp;·&nbsp;Experience Architect
          </p>

          {/* Title */}
          {customTitle ? (
            <h1 style={{
              fontFamily:    'Conthrax, sans-serif',
              fontWeight:    600,
              fontSize:      'clamp(40px, 7vw, 96px)',
              lineHeight:    1.0,
              letterSpacing: '-0.01em',
              color:         'var(--white)',
              margin:        '0 0 40px',
            }}>
              {customTitle}
              <span style={{ color: 'var(--gold)' }}>.</span>
            </h1>
          ) : (
            <h1 style={{
              fontFamily:    'Conthrax, sans-serif',
              fontWeight:    600,
              fontSize:      'clamp(40px, 7vw, 96px)',
              lineHeight:    1.0,
              letterSpacing: '-0.01em',
              color:         'var(--white)',
              margin:        '0 0 40px',
            }}>
              THE<br />
              <span style={{ color: '#a66bff' }}>BAE</span><br />
              <span style={{ color: 'var(--gold)' }}>AGENDA</span>
            </h1>
          )}

          <p style={{
            fontFamily:    'DM Sans, sans-serif',
            fontSize:      'clamp(14px, 1.4vw, 17px)',
            fontWeight:    300,
            color:         'var(--muted)',
            lineHeight:    1.7,
            maxWidth:      '420px',
            margin:        '0 0 48px',
            letterSpacing: '0.01em',
          }}>
            {subtitle}
          </p>

          {/* CTAs */}
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '16px',
            flexWrap:    'wrap',
          }}>
            <Link href="/book" className="btn-primary">
              {ctaPrimary}
            </Link>
            <Link href="/#mixes" className="btn-ghost">
              {ctaSecondary} <span aria-hidden="true">→</span>
            </Link>
          </div>

        </div>

        {/* Scroll indicator — bottom of the right panel */}
        <div aria-hidden="true" style={{
          position:  'absolute',
          bottom:    '36px',
          left:      'clamp(32px, 4vw, 64px)',
          display:   'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap:       '8px',
          opacity:   0.3,
        }}>
          <span style={{
            fontSize: '8px', letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'var(--white)',
          }}>
            Scroll
          </span>
          <div style={{
            width: '1px', height: '40px',
            background: 'linear-gradient(to bottom, var(--white), transparent)',
          }} />
        </div>

      </div>

      <div className="genre-band" aria-hidden="true">
        <div className="genre-track">
          {[...genres, ...genres].map((genre, i) => (
            <span key={`${genre}-${i}`} className="genre-chip">
              {genre}
            </span>
          ))}
        </div>
      </div>

    </section>
  )
}
