import BookingForm from '@/components/public/booking/BookingForm'
import { BOOKING_FAQ } from '@/components/public/booking/BookingFaq'
import BookExperienceRail from '@/components/public/BookExperienceRail'

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: BOOKING_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
}

export default function BookPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="book-experience">
        <section className="book-experience-form" aria-label="Booking inquiry">
          <BookingForm embedded />
        </section>
        <aside className="book-experience-rail" aria-label="Contact and booking information">
          <BookExperienceRail />
        </aside>
      </div>
    </>
  )
}
