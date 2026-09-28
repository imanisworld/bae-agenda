import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PrintPressKitButton from '@/components/public/PrintPressKitButton'
import { SELECTED_WORK } from '@/lib/portfolio-data'
import { getContentMap } from '@/lib/db/content'

export const metadata: Metadata = {
  title: 'Press Kit',
  alternates: {
    canonical: '/press-kit',
  },
  description: 'DJ B.A.E. press kit with artist bio, booking information, and selected work.',
}

const CONTENT_KEYS = [
  'hero_title',
  'hero_subtitle',
  'booking_email',
  'instagram_url',
  'soundcloud_url',
  'youtube_url',
] as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '2px' }}>
      <div style={{ width: '18px', height: '2px', background: '#b8820e', flexShrink: 0 }} />
      <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#b8820e', fontWeight: 600 }}>
        {children}
      </div>
    </div>
  )
}

export default async function PressKitPage() {
  const content = await getContentMap([...CONTENT_KEYS])

  const title = content.hero_title ?? 'THE BAE AGENDA'
  const subtitle = content.hero_subtitle ?? 'Open-format DJ based in Indianapolis, with roots in Chicago.'
  const about = 'From Chicago’s South Side and now based in Indianapolis, DJ B.A.E. is an open-format DJ shaped by music, visual art, and years spent around different scenes, including time in Boston. Her sets move through hip-hop, R&B, house, juke, club, jungle, bass, baile, and underground edits with a simple approach: read the room, respect the music, and make every transition make sense.'
  const bookingEmail = content.booking_email ?? ''

  return (
    <div className="press-kit-page" style={{ background: '#ece8df', color: '#111', padding: `calc(var(--nav-height) + var(--safe-top) + clamp(20px, 5vw, 32px)) max(20px, calc(var(--safe-right) + 16px)) max(clamp(20px, 5vw, 40px), calc(var(--safe-bottom) + 20px)) max(20px, calc(var(--safe-left) + 16px))` }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <div className="print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link
            href="/meet"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              minHeight: '44px',
              background: '#111',
              color: '#f4f1eb',
              textDecoration: 'none',
              border: '1px solid rgba(0,0,0,0.18)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            ← Meet
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#666' }}>
              Press Kit
            </div>
            <PrintPressKitButton />
          </div>
        </div>

        <article
          className="press-kit-sheet"
          style={{
            background: '#f8f5ef',
            border: '1px solid rgba(0,0,0,0.14)',
            boxShadow: '0 18px 60px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 0.95fr) minmax(0, 1.05fr)',
          }}
        >
          <div
            className="press-kit-left"
            style={{
              position: 'relative',
              minHeight: '760px',
              background: 'linear-gradient(180deg, rgba(16,16,20,0.16), rgba(16,16,20,0.4)), #111',
              color: '#fffdfa',
              display: 'grid',
              alignContent: 'end',
            }}
          >
            <Image
              src="/photos/PlexMix19-DJBAE.JPEG"
              alt="DJ B.A.E. press photo"
              fill
              sizes="(max-width: 900px) 100vw, 420px"
              quality={95}
              style={{ objectFit: 'cover', objectPosition: 'center 18%' }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(20,20,24,0.06) 0%, rgba(20,20,24,0.18) 36%, rgba(20,20,24,0.82) 100%)',
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '24px',
                display: 'grid',
                gap: '14px',
              }}
            >
              <div style={{ fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>
                Official Press Kit
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(36px, 4.5vw, 68px)', lineHeight: 0.92 }}>
                  DJ
                  <br />
                  B.A.E.
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {['Open Format', 'House', 'Hip-Hop', 'R&B', 'Afrobeats', 'Dancehall'].map((item) => (
                  <span
                    key={item}
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      padding: '6px 8px',
                      border: '1px solid rgba(255,255,255,0.16)',
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            className="press-kit-right"
            style={{
              padding: 'clamp(20px, 3vw, 28px)',
              display: 'grid',
              gap: '18px',
              background: 'linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(248,245,239,0.95) 100%)',
            }}
          >
            <header style={{ display: 'grid', gap: '12px' }}>
              <SectionLabel>Press Kit</SectionLabel>
              <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(26px, 3.2vw, 46px)', lineHeight: 0.94, margin: 0 }}>
                {title}
              </h1>
              <p style={{ fontSize: '13px', lineHeight: 1.65, color: '#262626', maxWidth: '560px', margin: 0 }}>
                {subtitle}
              </p>
            </header>

            <section style={{ display: 'grid', gap: '12px' }}>
              <SectionLabel>Artist Bio</SectionLabel>
              <p style={{ fontSize: '13px', lineHeight: 1.65, margin: 0, color: '#1f1f1f' }}>
                {about}
              </p>
              <p style={{ fontSize: '12px', lineHeight: 1.6, margin: 0, color: '#444' }}>
                Available for club nights, private events, weddings, brand activations, and other events that need a set tailored to the room.
              </p>
            </section>

            <section style={{ display: 'grid', gap: '10px' }}>
              <SectionLabel>Booking</SectionLabel>
              <div style={{ background: 'rgba(17,17,17,0.04)', border: '1px solid rgba(0,0,0,0.1)', padding: '14px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7a7a7a', marginBottom: '8px' }}>
                  Email
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
                  {bookingEmail ? (
                    <a href={`mailto:${bookingEmail}`} style={{ color: '#111', textDecoration: 'none', fontWeight: 600 }}>
                      {bookingEmail}
                    </a>
                  ) : (
                    <span>Available on request</span>
                  )}
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gap: '14px' }}>
              <SectionLabel>Selected Work</SectionLabel>
              <div style={{ display: 'grid', gap: '12px' }}>
                {SELECTED_WORK.map((item) => (
                  <div key={item.id} style={{ padding: '14px 0', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px' }}>{item.title}</strong>
                      <span style={{ fontSize: '12px', color: '#666' }}>{item.year}</span>
                    </div>
                    <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a7a7a', marginBottom: '6px' }}>
                      {item.category}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: '#303030' }}>{item.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
