/**
 * HERO SECTION — Server Component
 * Full-viewport hero. Hover states via CSS classes (no JS event handlers).
 * Glow blobs live in HeroGlowLayer (Client Component) for parallax + float.
 */
import Link          from 'next/link'
import HeroGlowLayer from '@/components/effects/HeroGlowLayer'

export default function HeroSection() {
  return (
    <section
      id="home"
      aria-label="DJ B.A.E. — The Bae Agenda"
      style={{
        position: 'relative', minHeight: '100svh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', background: 'var(--black)',
        padding: '120px 64px 80px',
      }}
    >
      <div className="noise-overlay" aria-hidden="true" />
      <HeroGlowLayer />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', maxWidth: '1100px', width: '100%',
      }}>
        <p style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '10px',
          letterSpacing: '0.4em', textTransform: 'uppercase',
          color: 'var(--muted)', marginBottom: '32px',
        }}>
          Chicago&nbsp;·&nbsp;DJ&nbsp;·&nbsp;Curator&nbsp;·&nbsp;Experience Architect
        </p>

        <h1 style={{
          fontFamily: 'Conthrax, sans-serif', fontWeight: 600,
          fontSize: 'clamp(52px, 9vw, 118px)', lineHeight: 1.0,
          letterSpacing: '-0.01em', color: 'var(--white)', margin: '0 0 40px',
        }}>
          THE BAE<br />
          <span style={{ color: 'var(--violet)' }}>AGENDA</span>
          <span style={{ color: 'var(--gold)' }}>.</span>
        </h1>

        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 'clamp(14px, 1.5vw, 17px)', fontWeight: 300,
          color: 'var(--muted)', lineHeight: 1.7,
          maxWidth: '480px', margin: '0 auto 48px', letterSpacing: '0.01em',
        }}>
          From intimate gatherings to club takeovers —<br />
          music is always the agenda.
        </p>

        {/* CTAs — hover handled by CSS classes in globals.css */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '16px', flexWrap: 'wrap',
        }}>
          <Link href="/book" className="btn-primary">
            Book Your Event
          </Link>
          <Link href="/mixes" className="btn-ghost">
            Listen to Mixes <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '36px', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '8px', opacity: 0.35,
      }}>
        <span style={{ fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--white)' }}>
          Scroll
        </span>
        <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, var(--white), transparent)' }} />
      </div>
    </section>
  )
}
