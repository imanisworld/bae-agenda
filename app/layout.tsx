import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  applicationName: 'The Bae Agenda',
  title: {
    default: 'DJ B.A.E. | Official Website | DJ in Indianapolis & Chicago',
    template: '%s | DJ B.A.E.',
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  description:
    'DJ B.A.E. — Indianapolis & Chicago DJ available for private events, weddings, club nights, festivals, and more. Book DJ BAE for your next event.',
  keywords: [
    'DJ BAE', 'DJ B.A.E.', 'Indianapolis DJ', 'Chicago DJ', 'The Bae Agenda',
    'event DJ', 'wedding DJ', 'club DJ', 'festival DJ', 'DJ Indianapolis',
    'DJ Chicago', 'book a DJ', 'private event DJ',
  ],
  openGraph: {
    siteName: 'DJ B.A.E. | The Bae Agenda',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'THE BAE',
  },
  metadataBase: new URL('https://thebaeagenda.com'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {/* Preload local Conthrax font to prevent layout shift */}
        <link
          rel="preload"
          href="/fonts/Conthrax-SemiBold.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
