import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PrintPressKitButton from '@/components/public/PrintPressKitButton'
import { SELECTED_WORK } from '@/lib/portfolio-data'
import { getContentMap } from '@/lib/db/content'
import { getPublishedMixes } from '@/lib/db/mixes'
import { SOCIALS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Press Kit — DJ B.A.E.',
  description: 'Printable press kit generated from the current site content and showcase data.',
}

const CONTENT_KEYS = [
  'hero_title',
  'hero_subtitle',
  'about_quote',
  'booking_email',
  'instagram_url',
  'soundcloud_url',
  'youtube_url',
] as const

export default async function PressKitPage() {
  const [content, mixes] = await Promise.all([
    getContentMap([...CONTENT_KEYS]),
    getPublishedMixes(6),
  ])

  const title = content.hero_title ?? 'THE BAE AGENDA'
  const subtitle = content.hero_subtitle ?? 'Private events, club nights, weddings & branded experiences.'
  const about = content.about_quote ?? 'Chicago-based DJ, curator, and experience architect.'
  const bookingEmail = content.booking_email ?? ''

  const socialMap = {
    Instagram: content.instagram_url,
    SoundCloud: content.soundcloud_url,
    YouTube: content.youtube_url,
  } as const

  const socialLinks = SOCIALS.map((social) => ({
    label: social.label,
    href: socialMap[social.label as keyof typeof socialMap] ?? social.url,
  }))

  const topMixes = mixes.slice(0, 3)

  return (
    <div style={{ background: '#ece8df', minHeight: '100vh', color: '#111', padding: 'clamp(20px, 5vw, 40px) 20px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <div className="print-hide" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <Link
            href="/portfolio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 22px',
              background: '#111',
              color: '#f4f1eb',
              textDecoration: 'none',
              border: '1px solid rgba(0,0,0,0.18)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Back To Portfolio
          </Link>
          <PrintPressKitButton />
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
            style={{
              position: 'relative',
              minHeight: '920px',
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
                padding: '32px',
                display: 'grid',
                gap: '18px',
              }}
            >
              <div style={{ fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>
                Official Press Kit
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(44px, 5vw, 86px)', lineHeight: 0.92 }}>
                  DJ
                  <br />
                  B.A.E.
                </div>
                <div style={{ fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b97dff' }}>
                  Club Sets • Private Events • Branded Experiences
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {['Open Format', 'House', 'Hip-Hop', 'R&B', 'Global Club'].map((item) => (
                  <span
                    key={item}
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      padding: '8px 10px',
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
            style={{
              padding: 'clamp(24px, 4vw, 36px)',
              display: 'grid',
              gap: '24px',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.1)), linear-gradient(135deg, rgba(112,68,255,0.08), rgba(0,0,0,0) 55%)',
            }}
          >
            <header style={{ display: 'grid', gap: '12px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#666' }}>
                Press Kit
              </div>
              <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(30px, 4vw, 60px)', lineHeight: 0.94, margin: 0 }}>
                {title}
              </h1>
              <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#262626', maxWidth: '580px', margin: 0 }}>
                {subtitle}
              </p>
            </header>

            <section style={{ display: 'grid', gap: '12px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#6d6d6d' }}>
                Artist Bio
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.8, margin: 0, color: '#1f1f1f' }}>
                {about}
              </p>
              <p style={{ fontSize: '13px', lineHeight: 1.7, margin: 0, color: '#444' }}>
                Available for club nights, private events, weddings, branded activations, and curated experiences built around room energy and clean execution.
              </p>
            </section>

            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))',
                gap: '14px',
              }}
            >
              <div style={{ background: 'rgba(17,17,17,0.04)', border: '1px solid rgba(0,0,0,0.1)', padding: '16px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7a7a7a', marginBottom: '10px' }}>
                  Booking
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.7 }}>
                  {bookingEmail ? (
                    <a href={`mailto:${bookingEmail}`} style={{ color: '#6132ff', textDecoration: 'none', fontWeight: 600 }}>
                      {bookingEmail}
                    </a>
                  ) : (
                    <span>Available on request</span>
                  )}
                </div>
              </div>
              <div style={{ background: 'rgba(17,17,17,0.04)', border: '1px solid rgba(0,0,0,0.1)', padding: '16px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7a7a7a', marginBottom: '10px' }}>
                  Links
                </div>
                <div style={{ display: 'grid', gap: '6px', fontSize: '13px', lineHeight: 1.6 }}>
                  {socialLinks.slice(0, 4).map((social) => (
                    <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'none' }}>
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gap: '14px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#6d6d6d' }}>
                Featured Mixes
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {topMixes.map((mix, index) => (
                  <div
                    key={mix.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 1fr',
                      gap: '12px',
                      alignItems: 'start',
                      paddingBottom: '10px',
                      borderBottom: index < topMixes.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'grid',
                        placeItems: 'center',
                        background: '#111',
                        color: '#fffdfa',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{mix.title}</div>
                      <div style={{ fontSize: '12px', color: '#555' }}>{mix.genre ?? 'Open Format'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ display: 'grid', gap: '14px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#6d6d6d' }}>
                Selected Work
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {SELECTED_WORK.slice(0, 2).map((item) => (
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
