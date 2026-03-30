import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book',
  alternates: {
    canonical: '/book',
  },
  description: 'Send a booking inquiry for DJ B.A.E. for private events, nightlife, branded events, and custom curations.',
  openGraph: {
    title: 'Book DJ B.A.E.',
    description: 'Send a booking inquiry for DJ B.A.E.',
    url: 'https://thebaeagenda.com/book',
    images: [{ url: '/photos/PlexMix19-DJBAE.JPEG', width: 1637, height: 1411, alt: 'DJ B.A.E. performing live' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book DJ B.A.E.',
    description: 'Send a booking inquiry for DJ B.A.E.',
    images: ['/photos/PlexMix19-DJBAE.JPEG'],
  },
}

export default function BookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
