import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Meet DJ B.A.E. — DJ B.A.E.',
  description: 'Meet DJ B.A.E. and get a closer look at the sound, setup, and energy behind the agenda.',
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

const atmosphereNotes = [
  'Warm-up control',
  'Peak-hour pressure',
  'Clean handoffs',
  'Mic-ready hosting',
  'Crowd resets',
  'Closing lift',
]

const LIVE_SET_EMBED_SRC = 'https://www.youtube.com/embed/videoseries?list=UUjEiMW5l_Go9vSHudx5VPEw'

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
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="section-container" style={{ display: 'grid', gap: '32px', paddingTop: 0 }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: '32px',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              minHeight: 'clamp(340px, 72vw, 520px)',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Image
              src="/photos/PlexMix19-DJBAE.JPEG"
              alt="DJ B.A.E. performing live"
              fill
              sizes="(max-width: 900px) 100vw, 420px"
              style={{ objectFit: 'cover', objectPosition: 'center 18%' }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(8,8,8,0.08), rgba(8,8,8,0.28) 55%, rgba(8,8,8,0.7) 100%)',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '18px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
          </div>

          <div style={{ display: 'grid', alignContent: 'center', gap: '24px' }}>
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
              <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '640px' }}>
                DJ B.A.E. moves between club sets, private events, branded experiences, and community nights without flattening the personality of the room.
                The through line is selection, pacing, and a set structure that knows when to push and when to hold back.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
              }}
              >
              <div style={{ border: '1px solid var(--border)', padding: '18px', background: 'var(--surface)' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                  Sound
                </div>
                <div style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.6 }}>
                  Open-format backbone with real range across hip-hop, R&amp;B, house, Afrobeats, dancehall, and edits.
                </div>
              </div>
              <div style={{ border: '1px solid var(--border)', padding: '18px', background: 'var(--surface)' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                  Travel
                </div>
                <div style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.6 }}>
                  Available for local and travel bookings when the event is the right fit.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/book" className="btn-primary">
                Book DJ B.A.E.
              </Link>
              <Link href="/press-kit" className="btn-ghost">
                Open Press Kit
              </Link>
            </div>
          </div>
        </section>

        <section className="build-console">
          <div className="build-console-topbar">
            <div className="build-console-screen">
              <div className="build-console-screen-label">Live Profile</div>
              <div className="build-console-screen-value">Meet / Booth / Room Read</div>
              <div className="build-console-screen-lines">
                {techItems.map((item) => (
                  <span key={item.label}>
                    <strong>{item.label}</strong> {item.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="build-console-chip-row" aria-hidden="true">
              <span>Club</span>
              <span>Private</span>
              <span>Travel</span>
            </div>
          </div>

          <div className="build-console-grid">
            <div
              className="build-console-copy"
              style={{
                background: 'linear-gradient(180deg, rgba(155,93,229,0.08), rgba(18,18,22,0.96))',
              }}
            >
              {sectionLabel('Energy Behind The Agenda')}
              <div
                style={{
                  position: 'relative',
                  minHeight: '360px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#050505',
                  overflow: 'hidden',
                }}
              >
                {/* Fallback — visible if iframe fails to load */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  background: 'linear-gradient(180deg, rgba(8,8,10,0.96), rgba(14,14,18,0.98))',
                }}>
                  <div style={{
                    fontSize: '10px',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'rgba(250,248,243,0.38)',
                  }}>
                    Live Sets
                  </div>
                  <a
                    href="https://www.youtube.com/channel/UCjEiMW5l_Go9vSHudx5VPEw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    Watch on YouTube →
                  </a>
                </div>
                <iframe
                  title="DJ B.A.E. live set reel"
                  src={LIVE_SET_EMBED_SRC}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  style={{ display: 'block', position: 'relative', zIndex: 1, width: '100%', height: '100%', minHeight: '360px', border: 0 }}
                />
              </div>
            </div>

            <div className="build-console-mixer">
              <div className="build-console-fx-header">
                <span>Set Architecture</span>
                <div className="build-console-mini-chips">
                  <span>Selection</span>
                  <span>Timing</span>
                  <span>Pressure</span>
                </div>
              </div>

              <div className="build-console-module-grid">
                {techItems.map((item) => (
                  <div key={item.label} className="build-console-module">
                    <div className="build-console-module-top">
                      <span className="build-console-module-category">{item.label}</span>
                    </div>
                    <div className="build-console-module-desc" style={{ minHeight: '72px' }}>
                      {item.value}
                    </div>
                    <div className="build-console-module-meter" aria-hidden="true">
                      <span />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
                  Event Atmosphere
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                  {atmosphereNotes.map((note, index) => (
                    <div
                      key={note}
                      className="build-console-pad"
                      style={{
                        minHeight: '92px',
                        background: index % 2 === 0 ? 'rgba(155,93,229,0.08)' : 'rgba(242,184,75,0.07)',
                        borderColor: 'rgba(255,255,255,0.12)',
                        alignItems: 'end',
                        padding: '14px',
                        aspectRatio: 'auto',
                        textAlign: 'left',
                        justifyItems: 'start',
                        lineHeight: 1.35,
                      }}
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '18px' }}>
                <a
                  href="https://www.youtube.com/@djb.a.e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ justifyContent: 'center' }}
                >
                  Watch More Live Sets
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            borderTop: '1px solid var(--border)',
            padding: '40px 0 64px',
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
