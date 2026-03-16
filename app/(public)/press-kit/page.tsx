import type { Metadata } from 'next'
import Link from 'next/link'
import PrintPressKitButton from '@/components/public/PrintPressKitButton'
import { SELECTED_WORK } from '@/lib/portfolio-data'
import { getContentMap } from '@/lib/db/content'
import { getPublishedMixes } from '@/lib/db/mixes'
import { SOCIALS } from '@/lib/constants'

const SOUNDCLOUD_PROFILE_URL = 'https://soundcloud.com/deejaybae'

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

  return (
    <div style={{ background: '#f4f1eb', minHeight: '100vh', color: '#111', padding: 'clamp(20px, 5vw, 40px) 20px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
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
          style={{
            background: '#fffdfa',
            border: '1px solid rgba(0,0,0,0.12)',
            padding: 'clamp(22px, 4vw, 40px)',
            display: 'grid',
            gap: '28px',
          }}
        >
          <header style={{ display: 'grid', gap: '14px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#666' }}>
              Press Kit
            </div>
            <h1 style={{ fontFamily: 'Conthrax, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', lineHeight: 1, margin: 0 }}>
              {title}
            </h1>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#333', maxWidth: '760px', margin: 0 }}>
              {subtitle}
            </p>
            <p style={{ fontSize: '12px', lineHeight: 1.7, color: '#666', maxWidth: '760px', margin: 0 }}>
              Sample press kit content for portfolio sharing. Final press text and credits can be swapped in later.
            </p>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#666', marginBottom: '10px' }}>
                Short Bio
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
                {about}
              </p>
            </div>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#666', marginBottom: '10px' }}>
                Booking Contact
              </div>
              <div style={{ display: 'grid', gap: '8px', fontSize: '13px', lineHeight: 1.7 }}>
                {bookingEmail && (
                  <div>
                    <a href={`mailto:${bookingEmail}`} style={{ color: '#5a2dff', textDecoration: 'underline' }}>
                      {bookingEmail}
                    </a>
                  </div>
                )}
                <div>Available for club nights, private events, branded activations, and curated experiences.</div>
              </div>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#666', marginBottom: '12px' }}>
                Socials
              </div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px', lineHeight: 1.7 }}>
                {socialLinks.map((social) => (
                  <div
                    key={social.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      paddingBottom: '10px',
                      borderBottom: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <strong style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {social.label}
                    </strong>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#5a2dff', textDecoration: 'underline' }}
                    >
                      Visit {social.label}
                    </a>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#666', marginBottom: '12px' }}>
                Mixes
              </div>
              <div style={{ display: 'grid', gap: '8px', fontSize: '13px', lineHeight: 1.7 }}>
                {mixes.slice(0, 3).map((mix) => (
                  <div key={mix.id}>
                    <a
                      href={SOUNDCLOUD_PROFILE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#5a2dff', textDecoration: 'underline' }}
                    >
                      {mix.title}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#666', marginBottom: '12px' }}>
              Selected Work
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {SELECTED_WORK.slice(0, 2).map((item) => (
                <div key={item.id} style={{ borderTop: '1px solid rgba(0,0,0,0.12)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <strong>{item.title}</strong>
                    <span>{item.location} · {item.year}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#444', marginBottom: '6px' }}>{item.category}</div>
                  <p style={{ margin: 0, lineHeight: 1.7 }}>{item.summary}</p>
                </div>
              ))}
            </div>
          </section>

        </article>
      </div>
    </div>
  )
}
