import BookingForm from '@/components/public/booking/BookingForm'
import { BOOKING_FAQ } from '@/components/public/booking/BookingFaq'
import BookExperienceRail from '@/components/public/BookExperienceRail'
import BookExperienceStage from '@/components/public/BookExperienceStage'

/** Served from cache and rebuilt in the background at most every 5 minutes; admin saves refresh it immediately (revalidatePath). */
export const revalidate = 300

const SITE_URL = 'https://thebaeagenda.com'

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: BOOKING_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'DJ B.A.E. DJ Services',
  serviceType: 'DJ services for private events, weddings, club nights, branded events, and nightlife',
  url: `${SITE_URL}/book`,
  provider: {
    '@type': 'Person',
    '@id': `${SITE_URL}/#dj-bae`,
    name: 'DJ B.A.E.',
    url: SITE_URL,
  },
  areaServed: [
    { '@type': 'City', name: 'Indianapolis, Indiana' },
    { '@type': 'City', name: 'Chicago, Illinois' },
  ],
}

export default function BookPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([faqJsonLd, serviceJsonLd]) }}
      />
      <BookExperienceStage
        form={<BookingForm embedded />}
        rail={<BookExperienceRail />}
      />
    </>
  )
}
