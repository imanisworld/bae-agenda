import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Book DJ B.A.E. | Indianapolis & Chicago' },
  alternates: {
    canonical: '/book',
  },
  description: 'Book DJ B.A.E. for private events, weddings, club nights, branded events, and custom DJ sets in Indianapolis, Chicago, and beyond.',
  openGraph: {
    title: 'Book DJ B.A.E. | Indianapolis & Chicago',
    description: 'Booking and contact for DJ B.A.E. — private events, weddings, club nights, branded events, and travel dates.',
    url: 'https://thebaeagenda.com/book',
    images: [{ url: '/photos/PlexMix19-DJBAE.JPEG', width: 1637, height: 1411, alt: 'DJ B.A.E. performing live' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book DJ B.A.E. | Indianapolis & Chicago',
    description: 'Booking and contact for DJ B.A.E. — private events, weddings, club nights, branded events, and travel dates.',
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
