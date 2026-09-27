/**
 * HOMEPAGE — approved editorial sequence.
 * Hero → Upcoming Events → Lab → Portfolio → Reviews → Booking.
 */
import type { Metadata } from 'next'
import HeroSection from '@/components/public/HeroSection'
import MixesSection from '@/components/public/MixesSection'
import EventsSection from '@/components/public/EventsSection'
import PortfolioTeaserSection from '@/components/public/PortfolioTeaserSection'
import BookingSection from '@/components/public/BookingSection'
import ReviewSection from '@/components/public/ReviewSection'
import HomepageSectionBoundary from '@/components/public/HomepageSectionBoundary'
import { getContentMap } from '@/lib/db/content'

export const dynamic = 'force-dynamic'

const HOME_OG_IMAGE = '/photos/images/outside.jpg'

export const metadata: Metadata = {
  title: { absolute: 'DJ B.A.E. | The Bae Agenda' },
  alternates: { canonical: '/' },
  description: 'Official DJ B.A.E. site for booking, live dates, artist info, and Bae’s in the Lab based in Indianapolis with roots in Chicago.',
  openGraph: {
    title: 'DJ B.A.E. | The Bae Agenda',
    description: 'Booking, live dates, artist info, and Bae’s in the Lab for DJ B.A.E.',
    url: 'https://thebaeagenda.com',
    images: [{ url: HOME_OG_IMAGE, width: 1565, height: 1037, alt: 'DJ B.A.E. homepage hero image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJ B.A.E. | The Bae Agenda',
    description: 'Booking, live dates, artist info, and Bae’s in the Lab for DJ B.A.E.',
    images: [HOME_OG_IMAGE],
  },
}

const HOME_CONTENT_KEYS = ['hero_title', 'hero_subtitle', 'booking_email'] as const

export default async function HomePage() {
  const content = await getContentMap([...HOME_CONTENT_KEYS])

  return (
    <>
      <HomepageSectionBoundary section="hero">
        <HeroSection content={{ hero_title: content.hero_title, hero_subtitle: content.hero_subtitle }} />
      </HomepageSectionBoundary>
      <HomepageSectionBoundary section="events"><EventsSection /></HomepageSectionBoundary>
      <HomepageSectionBoundary section="mixes"><MixesSection /></HomepageSectionBoundary>
      <HomepageSectionBoundary section="portfolio"><PortfolioTeaserSection /></HomepageSectionBoundary>
      <HomepageSectionBoundary section="reviews"><ReviewSection /></HomepageSectionBoundary>
      <HomepageSectionBoundary section="booking"><BookingSection bookingEmail={content.booking_email} /></HomepageSectionBoundary>
    </>
  )
}
