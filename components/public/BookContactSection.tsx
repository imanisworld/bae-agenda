import ReviewDrawer from '@/components/public/ReviewDrawer'
import { SOCIALS } from '@/lib/constants'
import { DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'
import { getContentMap } from '@/lib/db/content'
import styles from './BookContactSection.module.css'

const CONTACT_CONTENT_KEYS = ['booking_email', 'instagram_url', 'soundcloud_url', 'youtube_url'] as const

export default async function BookContactSection() {
  const content = await getContentMap([...CONTACT_CONTENT_KEYS])
  const bookingEmail = content.booking_email || DEFAULT_BOOKING_EMAIL

  const socials = SOCIALS.map((social) => ({
    ...social,
    url:
      social.label === 'Instagram' ? (content.instagram_url || social.url) :
      social.label === 'SoundCloud' ? (content.soundcloud_url || social.url) :
      social.label === 'YouTube' ? (content.youtube_url || social.url) :
      social.url,
  }))

  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={styles.inner}>
        <header className={styles.header}>
          <span>Contact</span>
          <h2 id="contact-title">Contact DJ B.A.E.</h2>
        </header>

        <div className={styles.contactRows}>
          <div>
            <small>Bookings</small>
            <a href={`mailto:${bookingEmail}`}>{bookingEmail}</a>
          </div>
          <div>
            <small>Web / general</small>
            <a href="mailto:imanicru@pm.me">imanicru@pm.me</a>
          </div>
        </div>

        <div className={styles.socials} aria-label="DJ B.A.E. social links">
          {socials.map((social) => (
            <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer">
              <span>{social.icon}</span>
              <strong>{social.label}</strong>
            </a>
          ))}
        </div>

        <div className={styles.review}>
          <div>
            <small>Already worked together?</small>
            <p>Played your event? Share the experience.</p>
          </div>
          <ReviewDrawer />
        </div>
      </div>
    </section>
  )
}
