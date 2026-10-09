import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PrintPressKitButton from '@/components/public/PrintPressKitButton'
import { SELECTED_WORK } from '@/lib/portfolio-data'
import { SOCIALS } from '@/lib/constants'
import { DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'
import { getContentMap } from '@/lib/db/content'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Press Kit',
  alternates: { canonical: '/press-kit' },
  description: 'DJ B.A.E. press kit with artist bio, booking information, and selected work.',
}

const CONTENT_KEYS = ['hero_title', 'hero_subtitle', 'booking_email', 'instagram_url', 'soundcloud_url'] as const
const FEATURED_SOCIALS = ['Instagram', 'TikTok', 'SoundCloud'] as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="press-kit-section-label"><i aria-hidden="true" />{children}</div>
}

export default async function PressKitPage() {
  const content = await getContentMap([...CONTENT_KEYS])
  const title = content.hero_title || 'THE BAE AGENDA'
  const subtitle = content.hero_subtitle || 'Open-format DJ based in Indianapolis, with roots in Chicago.'
  const bookingEmail = content.booking_email || DEFAULT_BOOKING_EMAIL
  const socials = SOCIALS.filter((social) => FEATURED_SOCIALS.some((name) => name === social.label))
    .map((social) => ({
      ...social,
      url: social.label === 'Instagram' ? content.instagram_url || social.url
        : social.label === 'SoundCloud' ? content.soundcloud_url || social.url
          : social.url,
    }))
  const about = 'From Chicago’s South Side and now based in Indianapolis, DJ B.A.E. draws on music, visual art, and years across different scenes, including time in Boston. Her sets move through hip-hop, R&B, house, juke, club, jungle, bass, baile, and underground edits with a simple approach: read the room, respect the music, and make every transition make sense.'

  return (
    <div className="press-kit-page">
      <div className="press-kit-wrap">
        <div className="press-kit-toolbar print-hide">
          <Link href="/meet" className="press-kit-toolbar-back">← Meet</Link>
          <span>Official press kit</span>
          <PrintPressKitButton />
        </div>

        <article className="press-kit-sheet">
          <div className="press-kit-left">
            <Image
              src="/photos/PlexMix19-DJBAE.JPEG"
              alt="DJ B.A.E. performing at Club Plex"
              fill
              sizes="(max-width: 900px) 100vw, 480px"
              quality={80}
              className="press-kit-photo"
            />
            <div className="press-kit-photo-shade" aria-hidden="true" />
            <div className="press-kit-photo-copy">
              <span className="press-kit-photo-kicker">Official Press Kit</span>
              <strong>DJ B.A.E.</strong>
              <div className="press-kit-genre-chips">
                <span>Open format</span><span>House</span><span>Hip-hop</span><span>R&B</span>
              </div>
            </div>
          </div>

          <div className="press-kit-right">
            <header className="press-kit-intro">
              <SectionLabel>Press Kit</SectionLabel>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </header>

            <section className="press-kit-bio">
              <SectionLabel>Artist Bio</SectionLabel>
              <p>{about}</p>
              <p>Available for club nights, private events, weddings, brand activations, and events that need a set tailored to the room.</p>
            </section>

            <section className="press-kit-booking">
              <SectionLabel>Booking</SectionLabel>
              <div className="press-kit-booking-card">
                <div>
                  <span>Booking inquiries</span>
                  <a href={`mailto:${bookingEmail}`} className="press-kit-email">{bookingEmail}</a>
                </div>
                <a className="press-kit-mail-cta" href={`mailto:${bookingEmail}?subject=DJ%20B.A.E.%20booking%20inquiry`}>Email to book <span aria-hidden="true">↗</span></a>
              </div>
            </section>

            <section className="press-kit-selected">
              <SectionLabel>Selected Work</SectionLabel>
              <div className="press-kit-work-list">
                {SELECTED_WORK.map((item, index) => (
                  <div className="press-kit-work-item" key={item.id}>
                    <div className="press-kit-work-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
                    <div className="press-kit-work-copy">
                      <div className="press-kit-work-heading">
                        <strong>{item.title}</strong>
                        <span>{item.year}</span>
                      </div>
                      <small>{item.category}</small>
                      <p>{item.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="press-kit-footer">
            <div className="press-kit-signature">
              <Image
                src="/brand/clean/dj-bae-logo-gold.png"
                alt="DJ B.A.E. gold logo"
                width={132}
                height={97}
                sizes="132px"
                className="press-kit-logo"
              />
              <div><strong>DJ B.A.E.</strong><span>Selector. Genre Bender. Sound Architect.</span></div>
            </div>
            <div className="press-kit-footer-actions">
              <nav className="press-kit-socials" aria-label="Press kit social links">
                {socials.map((social) => (
                  <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer">{social.label}</a>
                ))}
              </nav>
              <Link href="/book" className="press-kit-footer-book">Book DJ B.A.E. <span aria-hidden="true">↗</span></Link>
            </div>
            <a className="press-kit-qr" href="https://thebaeagenda.com" aria-label="Visit thebaeagenda.com">
              <Image src="/brand/press-kit-site-qr.png" width={80} height={80} alt="QR code linking to thebaeagenda.com" />
              <span>Scan for more</span>
            </a>
          </footer>
        </article>
      </div>
    </div>
  )
}
