import BookingForm from '@/components/public/booking/BookingForm'
import BookingFaq, { BOOKING_FAQ } from '@/components/public/booking/BookingFaq'
import BookContactSection from '@/components/public/BookContactSection'

// FAQPage structured data so the questions can surface in search results.
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
      <BookingForm />
      <BookingFaq />
      <BookContactSection />
    </>
  )
}
