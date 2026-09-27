import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book & Contact',
  alternates: {
    canonical: '/book',
  },
  description: 'Book DJ B.A.E. or get in touch for private events, nightlife, branded events, press, and collaborations.',
  openGraph: {
    title: 'Book & Contact DJ B.A.E.',
    description: 'Booking and contact for DJ B.A.E.',
    url: 'https://thebaeagenda.com/book',
    images: [{ url: '/photos/PlexMix19-DJBAE.JPEG', width: 1637, height: 1411, alt: 'DJ B.A.E. performing live' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book & Contact DJ B.A.E.',
    description: 'Booking and contact for DJ B.A.E.',
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
