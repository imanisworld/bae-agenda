import ReviewDrawer from '@/components/public/ReviewDrawer'
import { BOOKING_FAQ } from '@/components/public/booking/BookingFaq'
import { SOCIALS } from '@/lib/constants'
import { DEFAULT_BOOKING_EMAIL } from '@/lib/content-schema'
import { getContentMap } from '@/lib/db/content'

const CONTACT_KEYS = ['booking_email', 'instagram_url', 'soundcloud_url', 'youtube_url'] as const

export default async function BookExperienceRail() {
  const content = await getContentMap([...CONTACT_KEYS])
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
    <div className="book-experience-rail-inner" id="contact">
      <header>
        <span>Contact</span>
        <h2>Rather reach out directly?</h2>
        <p>Email, DM, or check a quick answer below.</p>
      </header>

      <div className="book-experience-contact">
        <div>
          <small>Bookings</small>
          <a href={`mailto:${bookingEmail}`}>{bookingEmail}</a>
        </div>
        <div>
          <small>Web / general</small>
          <a href="mailto:imanicru@pm.me">imanicru@pm.me</a>
        </div>
      </div>

      <div className="book-experience-socials" aria-label="DJ B.A.E. social links">
        {socials.map((social) => (
          <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer">
            <span>{social.icon}</span>{social.label}
          </a>
        ))}
      </div>

      <section className="book-experience-faq" aria-label="Booking questions">
        <span>Quick Answers</span>
        {BOOKING_FAQ.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <div className="book-experience-review">
        <div>
          <small>Already worked together?</small>
          <p>Share the experience.</p>
        </div>
        <ReviewDrawer />
      </div>
    </div>
  )
}
