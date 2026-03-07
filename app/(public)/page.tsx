/**
 * HOMEPAGE — The Bae Agenda
 * Assembles the public homepage from section components.
 * Server component — no client-side logic at this level.
 *
 * Sections:
 *   HeroSection    — full viewport, brand presence, CTAs
 *   MixesSection   — 3 featured mix cards (Phase 3: live data)
 *   EventsSection  — upcoming dates (Phase 3: live data)
 *   BookingSection — packages + booking CTA
 */
import HeroSection    from '@/components/public/HeroSection'
import MixesSection   from '@/components/public/MixesSection'
import EventsSection  from '@/components/public/EventsSection'
import BookingSection from '@/components/public/BookingSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MixesSection />
      <EventsSection />
      <BookingSection />
    </>
  )
}
