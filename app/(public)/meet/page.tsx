import type { Metadata } from 'next'
import MeetIdentityHero from '@/components/public/MeetIdentityHero'

export const metadata: Metadata = {
  title: { absolute: 'Meet DJ B.A.E. | Indianapolis & Chicago DJ' },
  alternates: { canonical: '/meet' },
  description: 'Meet DJ B.A.E., an open-format DJ based in Indianapolis with Chicago roots, and get a closer look at the sound behind The Bae Agenda.',
  openGraph: {
    title: 'Meet DJ B.A.E. | Indianapolis & Chicago DJ',
    description: 'Meet DJ B.A.E. and get a closer look at the sound behind The Bae Agenda.',
    url: 'https://thebaeagenda.com/meet',
    images: [{ url: '/photos/PlexMix19-DJBAE.JPEG', width: 1637, height: 1411, alt: 'DJ B.A.E. performing live' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet DJ B.A.E. | Indianapolis & Chicago DJ',
    description: 'Meet DJ B.A.E. and get a closer look at the sound behind The Bae Agenda.',
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
