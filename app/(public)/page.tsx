import type { Metadata } from 'next'
import HeroSection from '@/components/public/HeroSection'
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

export default async function HomePage() {
  const content = await getContentMap(['hero_title', 'hero_subtitle'])

  return (
    <div className="home-experience">
      <HeroSection content={{ hero_title: content.hero_title, hero_subtitle: content.hero_subtitle }} />
    </div>
  )
}
