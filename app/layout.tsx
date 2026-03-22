import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DJ B.A.E. — The Bae Agenda',
  description:
    'DJ · Curator · Experience Architect. Chicago-based DJ available for private events, weddings, club nights, and more.',
  keywords: ['DJ', 'Chicago DJ', 'DJ BAE', 'The Bae Agenda', 'event DJ', 'wedding DJ'],
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
      </body>
    </html>
  )
}
