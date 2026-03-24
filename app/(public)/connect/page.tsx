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
  Instagram:   '@dj_b.a.e.',
  TikTok:      '@djbae1',
  YouTube:     '@djb.a.e',
  SoundCloud:  'deejaybae',
  Facebook:    'DJ B.A.E.',
  'dot.cards': 'dot.cards/djbae',
}

export default function ConnectPage() {
  return (
    <div style={{ background: 'var(--black)', paddingTop: '68px' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="section-container connect-hero">
        <div className="hardware-heading">
          <span className="section-label">Stay Connected</span>
        </div>
        <h1>
          {/* THEBAEAGENDA — intentional no-space lockup */}
          <span style={{ color: 'var(--white)' }}>THEBAE</span>
          <span style={{ color: 'var(--violet)', letterSpacing: '0.04em' }}>AGENDA</span>
        </h1>
        <p className="connect-hero-sub">
          Find DJ B.A.E. — follow for sets, announcements, and updates.
        </p>
      </div>

      {/* ── Socials Grid ─────────────────────────────────── */}
      <div className="section-container" style={{ paddingTop: 0, paddingBottom: '56px' }}>
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
      <div className="section-container connect-review-bar">
        <div>
          <div className="connect-review-bar-label">Reviews</div>
          <p className="connect-review-bar-text">Played your event? Share the experience.</p>
        </div>
        <ReviewDrawer />
      </div>

      {/* ── Contact ──────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="section-container connect-contact">
          <div className="connect-contact-label">Contact</div>
          <div className="connect-contact-rows">
            <div className="connect-contact-row">
              <span className="connect-contact-type">Bookings</span>
              <a href="mailto:baebookings@proton.me" className="connect-contact-email">
                baebookings@proton.me
              </a>
            </div>
            <div className="connect-contact-row">
              <span className="connect-contact-type">Web Inquiries</span>
              <a href="mailto:imanicru@pm.me" className="connect-contact-email">
                imanicru@pm.me
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
