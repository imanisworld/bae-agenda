/**
 * HOMEPAGE — The Bae Agenda
 * Assembles the public homepage from section components.
 * Server component — no client-side logic at this level.
 *
 * Sections:
 *   HeroSection    — full viewport, brand presence, CTAs
 *   MixesSection   — 3 featured mix cards
 *   EventsSection  — upcoming dates (live Supabase data)
 *   BookingSection — packages + booking CTA
 *   BuiltSection   — tech stack / "built from scratch"
 *   ConnectSection — social links / "stay connected"
 */
import HeroSection    from '@/components/public/HeroSection'
import MixesSection   from '@/components/public/MixesSection'
import EventsSection  from '@/components/public/EventsSection'
import BookingSection from '@/components/public/BookingSection'
import BuiltSection   from '@/components/public/BuiltSection'
import ConnectSection from '@/components/public/ConnectSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MixesSection />
      <EventsSection />
      <BookingSection />
      <BuiltSection />
      <ConnectSection />
    </>
  )
}
