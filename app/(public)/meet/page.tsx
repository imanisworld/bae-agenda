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
      <div className="section-container" style={{ display: 'grid', gap: '32px', paddingTop: 0 }}>
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
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
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

        <SetControlSection techItems={techItems} />

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
