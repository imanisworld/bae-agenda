import type { Metadata } from 'next'
import MeetIdentityHero from '@/components/public/MeetIdentityHero'

export const metadata: Metadata = {
  title: 'Meet DJ B.A.E.',
  alternates: { canonical: '/meet' },
  description: 'Meet DJ B.A.E. and get a closer look at the sound, setup, and energy behind the agenda.',
  openGraph: {
    title: 'Meet DJ B.A.E.',
    description: 'A closer look at the sound, setup, and energy behind the agenda.',
    url: 'https://thebaeagenda.com/meet',
    images: [{ url: '/photos/PlexMix19-DJBAE.JPEG', width: 1637, height: 1411, alt: 'DJ B.A.E. performing live' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet DJ B.A.E.',
    description: 'A closer look at the sound, setup, and energy behind the agenda.',
    images: ['/photos/PlexMix19-DJBAE.JPEG'],
  },
}

export default function MeetPage() {
  return (
    <div className="meet-experience">
      <MeetIdentityHero />
    </div>
  )
}
