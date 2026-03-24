import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import SetControlSection from '@/components/public/SetControlSection'

export const metadata: Metadata = {
  title: 'Meet',
  description: 'Meet DJ B.A.E. and get a closer look at the sound, setup, and energy behind the agenda.',
  openGraph: {
    title: 'Meet DJ B.A.E.',
    description: 'A closer look at the sound, setup, and energy behind the agenda.',
    url: 'https://thebaeagenda.com/meet',
    images: [{ url: '/photos/PlexMix19-DJBAE.JPEG', width: 1637, height: 1411, alt: 'DJ B.A.E. performing live' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet DJ B.A.E.',
    description: 'A closer look at the sound, setup, and energy behind the agenda.',
    images: ['/photos/PlexMix19-DJBAE.JPEG'],
  },
}

const techItems = [
  {
    label: 'Setup',
    value: 'Controller, club booth, house mixer, or private-event rig. If there is a workable sound path, I can play on it.',
  },
  {
    label: 'Approach',
    value: 'Reads the room early, tightens transitions fast, and keeps the energy moving without forcing it.',
  },
  {
    label: 'Formats',
    value: 'Residencies, branded nights, weddings, birthdays, rooftops, after-parties, and custom curations.',
  },
]

const profileModules = [
  {
    label: 'Sound',
    value: 'Open-format backbone with real range across hip-hop, R&B, house, Afrobeats, dancehall, and edits.',
  },
  {
    label: 'Travel',
    value: 'Available for local and travel bookings when the event is the right fit and the room calls for it.',
  },
  {
    label: 'Read',
    value: 'Selection shifts with the floor, not against it. The goal is pressure, pacing, and payoff.',
  },
] as const

const operatingRange = [
  {
    label: 'Formats',
    value: 'Residencies, branded nights, weddings, birthdays, rooftops, after-parties, and private events.',
  },
  {
    label: 'Sound Path',
    value: 'Controller, club booth, house mixer, or private-event rig. If there is a workable path, the set adapts.',
  },
  {
    label: 'Approach',
    value: 'Read early. Build pressure slowly. Open the room up when it is ready instead of forcing the night forward.',
  },
] as const

function sectionLabel(text: string) {
  return (
    <div className="hardware-heading">
      <span className="section-label" style={{ color: 'var(--eyebrow)' }}>
        {text}
      </span>
    </div>
  )
}

export default function MeetPage() {
  return (
    <div style={{ background: 'var(--black)', paddingTop: '68px' }}>
      <div className="section-container" style={{ display: 'grid', gap: '24px', paddingTop: 0, paddingBottom: '32px' }}>
        <section
          className="meet-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: '32px',
            alignItems: 'stretch',
          }}
        >
          <div
            className="meet-hero-photo-shell"
            style={{
              minHeight: 'clamp(340px, 72vw, 520px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="meet-hero-status-row" aria-hidden="true">
              <span>Live</span>
              <span>Club / Private</span>
              <span>Travel Ready</span>
            </div>
            <Image
              className="meet-hero-photo"
              src="/photos/PlexMix19-DJBAE.JPEG"
              alt="DJ B.A.E. performing live"
              fill
              sizes="(max-width: 900px) 100vw, 420px"
              style={{ objectFit: 'cover', objectPosition: 'center 18%' }}
            />
            <div
              className="meet-hero-photo-overlay"
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(8,8,8,0.08), rgba(8,8,8,0.28) 55%, rgba(8,8,8,0.7) 100%)',
              }}
            />
            <div
              className="meet-hero-photo-frame"
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '18px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
            <div className="meet-hero-photo-scan" aria-hidden="true" />
            <div className="meet-hero-photo-readout" aria-hidden="true">
              <div className="meet-hero-photo-readout-label">Artist Profile</div>
              <div className="meet-hero-photo-readout-value">Selection / Timing / Room Read</div>
            </div>
            {/* Mobile-only name overlay — visible when photo stacks above copy */}
            <div className="meet-hero-mobile-name" aria-hidden="true">
              <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontFamily: 'DM Sans, sans-serif' }}>
                Artist Profile
              </div>
              <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 600, lineHeight: 0.95, color: 'var(--white)' }}>
                Meet<br />DJ B.A.E.
              </div>
            </div>
          </div>

          <div className="meet-hero-copy-panel">
            <div>
              {sectionLabel('Artist Profile')}
              <h1
                style={{
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: 'clamp(38px, 6vw, 78px)',
                  fontWeight: 600,
                  lineHeight: 0.95,
                  color: 'var(--white)',
                  margin: '0 0 18px',
                }}
              >
                Meet
                <br />
                DJ B.A.E.
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '640px', marginBottom: '18px' }}>
                DJ B.A.E. moves between club sets, private events, branded experiences, and community nights without flattening the personality of the room.
                The through line is selection, pacing, and a set structure that knows when to push and when to hold back.
              </p>

              <div className="meet-hero-copy-rail">
                <div className="meet-hero-copy-rail-label">Operating Style</div>
                <div className="meet-hero-copy-rail-value">Process-driven, but never mechanical. The setup serves the room.</div>
              </div>
            </div>

            <div className="meet-hero-module-grid">
              {profileModules.map((item, index) => (
                <div key={item.label} className="meet-hero-module">
                  <div className="meet-hero-module-top">
                    <span className="meet-hero-module-label">{item.label}</span>
                    <span className="meet-hero-module-index">0{index + 1}</span>
                  </div>
                  <div className="meet-hero-module-value">{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/book" className="btn-primary">
                Book DJ B.A.E.
              </Link>
              <Link href="/press-kit" className="inline-link">
                Open Press Kit
              </Link>
            </div>
          </div>
        </section>

        <section className="meet-operating-range">
          <div style={{ marginBottom: '20px' }}>
            {sectionLabel('Operating Range')}
            <h2 style={{
              fontFamily: 'Conthrax, sans-serif',
              fontSize: 'clamp(22px, 3.4vw, 36px)',
              lineHeight: 1.08,
              color: 'var(--white)',
              margin: 0,
            }}>
              Built for different rooms,
              <br />
              consistent in execution.
            </h2>
          </div>

          <div className="set-control-atmosphere-grid">
            {operatingRange.map((item) => (
              <div
                key={item.label}
                className="set-control-atmosphere-card"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'linear-gradient(180deg, rgba(24,24,28,0.96), rgba(12,12,16,0.96))',
                  padding: '18px 18px 20px',
                }}
              >
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--violet)',
                  marginBottom: '10px',
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '13px',
                  lineHeight: 1.72,
                  color: 'var(--muted)',
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <SetControlSection techItems={techItems} />

        <section
          style={{
            borderTop: '1px solid var(--border)',
            padding: '40px 0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
              Booking
            </div>
            <div style={{ fontSize: '15px', color: 'var(--white)', lineHeight: 1.7, maxWidth: '620px' }}>
              Need a DJ who can move between curation, crowd reading, and clean execution without turning the night into a template?
            </div>
          </div>
          <Link href="/book" className="btn-primary">
            Start A Booking Request
          </Link>
        </section>
      </div>
    </div>
  )
}
