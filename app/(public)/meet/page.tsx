import type { Metadata } from 'next'
import Image from 'next/image'
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
]

const LIVE_SET_EMBED_SRC = 'https://www.youtube.com/embed/videoseries?list=UUjEiMW5l_Go9vSHudx5VPEw'

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
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
                background: '#050505',
                overflow: 'hidden',
              }}
            >
              <iframe
                title="DJ B.A.E. live set reel"
                src={LIVE_SET_EMBED_SRC}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ display: 'block', width: '100%', height: '100%', minHeight: '360px', border: 0 }}
              />
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '10px' }}>
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
