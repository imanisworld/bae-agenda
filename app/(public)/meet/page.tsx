import type { Metadata } from 'next'
import Link from 'next/link'
import SetControlSection from '@/components/public/SetControlSection'
import MeetIdentityHero from '@/components/public/MeetIdentityHero'

export const metadata: Metadata = {
  title: 'Meet DJ B.A.E.',
  alternates: {
    canonical: '/meet',
  },
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

// Passed to the approach section.
const techItems = [
  {
    label: 'Selection',
    value: 'Open-format across hip-hop, R&B, house, Afrobeats, dancehall, and edits — pulled from what the room needs, not a pre-built tracklist.',
  },
  {
    label: 'Timing',
    value: 'Reads the energy early. Builds pressure through pacing. Opens the floor when the room earns it, not on a clock.',
  },
  {
    label: 'Rig',
    value: 'Controller, club booth, house mixer, or private-event setup. Adapts to whatever sound path is available.',
  },
]

// Common room contexts.
const operatingRange = [
  {
    label: 'Clubs & Nightlife',
    value: 'Full-night sets, warm-up slots, and nightlife rooms where pacing follows the crowd instead of a fixed template.',
  },
  {
    label: 'Private Events',
    value: 'Weddings, birthdays, rooftops, and branded nights. Format is built around the crowd and the vibe, not forced.',
  },
  {
    label: 'Travel',
    value: 'Indianapolis-based with travel-ready logistics. Available beyond the local market when the event is the right fit.',
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
    <div className="meet-page-shell" style={{ background: 'var(--black)' }}>
      <div
        className="section-container"
        style={{
          display: 'grid',
          gap: '24px',
          paddingTop: 'calc(var(--safe-top) + 12px)',
          paddingBottom: '32px',
        }}
      >
        <MeetIdentityHero />

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
              Different rooms, one adaptable approach.
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
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--violet)',
                  marginBottom: '10px',
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '15px',
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
              Planning a club night, private event, wedding, or branded room?
            </div>
          </div>
          <Link href="/book" className="btn-primary">
            Booking Inquiry
          </Link>
        </section>
      </div>
    </div>
  )
}
