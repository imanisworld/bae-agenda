/**
 * HOMEPAGE — The Bae Agenda
 * Assembles the public homepage from section components.
 * Server component — fetches site_content once and passes to sections.
 *
 * Sections:
 *   HeroSection    — full viewport, brand presence, CTAs (reads hero copy)
 *   MixesSection   — 3 featured mix cards
 *   EventsSection  — upcoming dates (live Supabase data)
 *   BookingSection — packages + booking CTA (reads booking_email)
 *   BuiltSection   — tech stack / "built from scratch" (reads about_quote)
 *   ConnectSection — social links / "stay connected" (reads social URLs)
 */
import HeroSection    from '@/components/public/HeroSection'
import MixesSection   from '@/components/public/MixesSection'
import EventsSection  from '@/components/public/EventsSection'
import BookingSection from '@/components/public/BookingSection'
import BuiltSection   from '@/components/public/BuiltSection'
import ConnectSection from '@/components/public/ConnectSection'
import { getContentMap } from '@/lib/db/content'

// All keys needed on the homepage — fetched in a single Supabase query.
// Add new keys here when wiring new CMS fields to homepage sections.
const HOME_CONTENT_KEYS = [
  'hero_title',
  'hero_subtitle',
  'hero_cta_primary',
  'hero_cta_secondary',
  'about_quote',
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
          hero_title:         content.hero_title,
          hero_subtitle:      content.hero_subtitle,
          hero_cta_primary:   content.hero_cta_primary,
          hero_cta_secondary: content.hero_cta_secondary,
        }}
      />
      <MixesSection />
      <EventsSection />
      <BookingSection
        bookingEmail={content.booking_email}
      />
      <BuiltSection
        aboutQuote={content.about_quote}
      />
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
