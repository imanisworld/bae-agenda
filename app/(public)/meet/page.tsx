import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Meet DJ B.A.E. — DJ B.A.E.',
  description: 'Meet DJ B.A.E. and get a closer look at the sound, setup, and energy behind the agenda.',
}

const collageCards = [
  {
    label: 'Club Sets',
    title: 'High-pressure transitions built for packed rooms.',
    accent: 'var(--violet)',
    background:
      'linear-gradient(135deg, rgba(155,93,229,0.4), rgba(10,10,10,0.96) 58%)',
  },
  {
    label: 'Private Events',
    title: 'Polished curation for weddings, branded events, and celebrations.',
    accent: 'var(--gold)',
    background:
      'linear-gradient(135deg, rgba(242,184,75,0.34), rgba(10,10,10,0.96) 60%)',
  },
  {
    label: 'Open Format',
    title: 'Hip-hop, R&B, house, Afrobeats, dancehall, and left turns when the room wants them.',
    accent: '#55d6be',
    background:
      'linear-gradient(135deg, rgba(85,214,190,0.28), rgba(8,8,8,0.96) 60%)',
  },
]

const techItems = [
  {
    label: 'Setup',
    value: 'Club-ready digital workflow with flexible routing for venue sound and private production rigs.',
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
]

function sectionLabel(text: string) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <span style={{ width: '22px', height: '1px', background: 'var(--violet)', display: 'block', flexShrink: 0 }} />
      <span style={{ fontSize: '10px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {text}
      </span>
    </div>
  )
}

export default function MeetPage() {
  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', paddingTop: '120px' }}>
      <div className="section-container" style={{ display: 'grid', gap: '32px' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 420px) minmax(320px, 1fr)',
            gap: '32px',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              minHeight: '520px',
              border: '1px solid var(--border)',
              background:
                'radial-gradient(circle at 50% 25%, rgba(155,93,229,0.32), transparent 34%), linear-gradient(180deg, #181818, #080808 72%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '18px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '14% 20% 0',
                background:
                  'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 28%, transparent 52%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0))',
                filter: 'blur(0.5px)',
              }}
            />
            <div style={{ position: 'absolute', left: '28px', bottom: '28px', right: '28px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.56)', marginBottom: '8px' }}>
                Meet DJ B.A.E.
              </div>
              <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--white)', lineHeight: 1.05 }}>
                Built for rooms that need range, timing, and control.
              </div>
            </div>
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
                  Cities
                </div>
                <div style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.6 }}>
                  Chicago roots with flexibility for destination bookings and recurring nights.
                </div>
              </div>
              <div style={{ border: '1px solid var(--border)', padding: '18px', background: 'var(--surface)' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                  Sound
                </div>
                <div style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.6 }}>
                  Open-format backbone with real range across hip-hop, R&amp;B, house, Afrobeats, dancehall, and edits.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/book" className="btn-primary">
                Book DJ B.A.E.
              </Link>
              <Link href="/mixes" className="btn-ghost">
                Listen To Mixes
              </Link>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: '18px' }}>
          {sectionLabel('Editorial View')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            {collageCards.map((card) => (
              <article
                key={card.label}
                className="card-hover"
                style={{
                  minHeight: '240px',
                  padding: '22px',
                  border: '1px solid var(--border)',
                  background: card.background,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: card.accent,
                  }}
                >
                  {card.label}
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'Conthrax, sans-serif',
                    fontSize: 'clamp(18px, 2vw, 24px)',
                    lineHeight: 1.2,
                    color: 'var(--white)',
                  }}
                >
                  {card.title}
                </h2>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(280px, 0.8fr)',
            gap: '24px',
          }}
        >
          <div
            style={{
              border: '1px solid var(--border)',
              background: 'linear-gradient(180deg, rgba(155,93,229,0.08), rgba(255,255,255,0.01))',
              padding: '28px',
            }}
          >
            {sectionLabel('Energy Behind The Agenda')}
            <div
              style={{
                position: 'relative',
                minHeight: '360px',
                border: '1px solid rgba(255,255,255,0.08)',
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.44)), radial-gradient(circle at 30% 24%, rgba(155,93,229,0.38), transparent 26%), radial-gradient(circle at 74% 30%, rgba(242,184,75,0.22), transparent 20%), linear-gradient(135deg, #151515, #070707 68%)',
                overflow: 'hidden',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: '18px',
                  bottom: '18px',
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: 'clamp(26px, 4vw, 42px)',
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.1)',
                }}
              >
                B.A.E.
              </div>
              <div style={{ position: 'absolute', left: '24px', top: '24px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                  Performance Reel
                </div>
                <div style={{ fontSize: '14px', color: 'var(--white)', maxWidth: '300px', lineHeight: 1.7 }}>
                  The live side is timing, recovery, and pressure control. The job is not just to play records. It is to keep the room in motion.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: '24px',
              }}
            >
              {sectionLabel('Gear & Tech')}
              <div style={{ display: 'grid', gap: '18px' }}>
                {techItems.map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--white)', lineHeight: 1.7 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: '1px solid var(--border)',
                padding: '20px',
                background:
                  'linear-gradient(160deg, rgba(255,255,255,0.02), rgba(255,255,255,0)), radial-gradient(circle at 20% 10%, rgba(155,93,229,0.14), transparent 24%), #0b0b0b',
                display: 'grid',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Event Atmosphere
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                {atmosphereNotes.map((note, index) => (
                  <div
                    key={note}
                    style={{
                      minHeight: '92px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: index % 2 === 0 ? 'rgba(155,93,229,0.08)' : 'rgba(242,184,75,0.07)',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      color: 'var(--white)',
                      fontSize: '12px',
                    }}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            borderTop: '1px solid var(--border)',
            padding: '32px 0 12px',
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
