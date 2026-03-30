/**
 * HOMEPAGE — The Bae Agenda
 * Assembles the public homepage from section components.
 * Server component — fetches site_content once and passes to sections.
 *
 * Sections:
 *   HeroSection          — full viewport, brand presence (reads hero copy)
 *   LabSection           — animated coming-soon teaser for Bae's in the Lab
 *   EventsSection        — upcoming dates (live Supabase data)
 *   PortfolioTeaserSection — featured portfolio pulled from Supabase
 *   BookingSection       — packages + booking CTA (reads booking_email)
 *   ConnectSection       — social links / "stay connected" (reads social URLs)
 */
import type { Metadata }      from 'next'
import HeroSection              from '@/components/public/HeroSection'
import MixesSection             from '@/components/public/MixesSection'
import EventsSection            from '@/components/public/EventsSection'
import PhotoStrip               from '@/components/public/PhotoStrip'
import PortfolioTeaserSection   from '@/components/public/PortfolioTeaserSection'
import BookingSection           from '@/components/public/BookingSection'
import ConnectSection           from '@/components/public/ConnectSection'
import ReviewSection            from '@/components/public/ReviewSection'
import { getContentMap }        from '@/lib/db/content'

export const dynamic = 'force-dynamic'

const HOME_OG_IMAGE = '/photos/images/outside.jpg'

export const metadata: Metadata = {
  title: 'Official Website',
  alternates: {
    canonical: '/',
  },
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

// All keys needed on the homepage — fetched in a single Supabase query.
const HOME_CONTENT_KEYS = [
  'hero_title',
  'hero_subtitle',
  'booking_email',
  'instagram_url',
  'soundcloud_url',
  'youtube_url',
] as const

export default async function HomePage() {
  // Single Supabase call for all homepage content.
  // Falls back to {} on any error — components use CONTENT_DEFAULTS as fallback.
  const content = await getContentMap([...HOME_CONTENT_KEYS])

  return (
    <>
      <HeroSection
        content={{
          hero_title:    content.hero_title,
          hero_subtitle: content.hero_subtitle,
        }}
      />
      <MixesSection />
      <EventsSection />
      <PhotoStrip />
      <PortfolioTeaserSection />
      <BookingSection
        bookingEmail={content.booking_email}
      />
      <ReviewSection />
      <ConnectSection
        socialOverrides={{
          instagram_url:  content.instagram_url,
          soundcloud_url: content.soundcloud_url,
          youtube_url:    content.youtube_url,
        }}
      />
    </>
  )
}
