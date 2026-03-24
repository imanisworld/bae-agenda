/**
 * /connect — Stay Connected
 * Focused social + reviews page.
 */
import type { Metadata } from 'next'
import { SOCIALS } from '@/lib/constants'
import ReviewSection from '@/components/public/ReviewSection'
import ReviewDrawer from '@/components/public/ReviewDrawer'

export const metadata: Metadata = {
  title: 'Connect',
  description: 'Follow DJ B.A.E. for sets, announcements, and updates.',
  openGraph: {
    title: 'Connect · DJ B.A.E.',
    description: 'Follow for sets, announcements, and updates.',
    url: 'https://thebaeagenda.com/connect',
  },
}

const SOCIAL_HANDLES: Record<string, string> = {
  Instagram:  '@dj_b.a.e.',
  TikTok:     '@djbae1',
  YouTube:    '@djb.a.e',
  SoundCloud: 'deejaybae',
  Facebook:   'DJ B.A.E.',
  'dot.cards': 'dot.cards/djbae',
}

export default function ConnectPage() {
  return (
    <div style={{ background: 'var(--black)', paddingTop: '68px' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="section-container" style={{ paddingTop: '52px', paddingBottom: '44px' }}>
        <div className="hardware-heading">
          <span className="section-label">Stay Connected</span>
        </div>
        <h1
          style={{
            fontFamily: 'Conthrax, sans-serif',
            fontSize: 'clamp(36px, 7vw, 72px)',
            fontWeight: 600,
            lineHeight: 0.95,
            margin: '12px 0 0',
            letterSpacing: '-0.01em',
          }}
        >
          {/* THEBAEAGENDA — intentional no-space lockup */}
          <span style={{ color: 'var(--white)' }}>THEBAE</span>
          <span style={{ color: 'var(--violet)', letterSpacing: '0.04em' }}>AGENDA</span>
        </h1>
        <p style={{
          marginTop: '20px',
          fontSize: '14px',
          color: 'var(--muted)',
          lineHeight: 1.7,
          maxWidth: '420px',
        }}>
          Find DJ B.A.E. — follow for sets, announcements, and updates.
        </p>
      </div>

      {/* ── Socials Grid ─────────────────────────────────── */}
      <div
        className="section-container"
        style={{ paddingTop: 0, paddingBottom: '56px' }}
      >
        <div className="connect-socials-grid">
          {SOCIALS.map(({ label, url, icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`DJ B.A.E. on ${label}`}
              className="connect-social-card"
            >
              <span className="connect-social-icon">{icon}</span>
              <div>
                <div className="connect-social-name">{label}</div>
                <div className="connect-social-handle">{SOCIAL_HANDLES[label] ?? ''}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Reviews ──────────────────────────────────────── */}
      <ReviewSection hideForm />

      {/* ── Leave a Review ───────────────────────────────── */}
      <div
        className="section-container"
        style={{
          paddingTop: '32px',
          paddingBottom: '40px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
            Reviews
          </div>
          <p style={{ fontSize: '14px', color: 'var(--white)', margin: 0, lineHeight: 1.6, maxWidth: '400px' }}>
            Played your event? Share the experience.
          </p>
        </div>
        <ReviewDrawer />
      </div>

      {/* ── Contact ──────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div
          className="section-container"
          style={{ paddingTop: '40px', paddingBottom: '48px' }}
        >
          <div style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
            Contact
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', minWidth: '120px' }}>
                Bookings
              </span>
              <a
                href="mailto:baebookings@proton.me"
                style={{ fontSize: '14px', color: 'var(--white)', textDecoration: 'none' }}
              >
                baebookings@proton.me
              </a>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', minWidth: '120px' }}>
                Web Inquiries
              </span>
              <a
                href="mailto:imanicru@pm.me"
                style={{ fontSize: '14px', color: 'var(--white)', textDecoration: 'none' }}
              >
                imanicru@pm.me
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
