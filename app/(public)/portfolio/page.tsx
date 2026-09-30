import type { Metadata } from 'next'
import { getPortfolioEntries, getFeaturedPortfolioEntries, getPortfolioStats } from '@/app/actions/portfolio'
import PortfolioExperienceStage from '@/components/public/PortfolioExperienceStage'
import { SOCIALS } from '@/lib/constants'
import { getContentMap } from '@/lib/db/content'
import { parseInstagramPosts } from '@/lib/instagram'
import { CONTENT_DEFAULTS } from '@/lib/content-schema'

export const metadata: Metadata = {
  title: { absolute: 'DJ B.A.E. Portfolio | Indianapolis & Chicago' },
  alternates: { canonical: '/portfolio' },
  description: 'Full gig history, featured events, and press for DJ B.A.E. — Indianapolis & Chicago DJ. Club nights, festivals, private events, and more.',
  openGraph: {
    title: 'DJ B.A.E. Portfolio | Indianapolis & Chicago',
    description: 'DJ B.A.E. gig history, featured events, club nights, festivals, and private events.',
    url: 'https://thebaeagenda.com/portfolio',
    images: [{ url: '/photos/PlexMix19-DJBAE.JPEG', width: 1637, height: 1411, alt: 'DJ B.A.E. performing live' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJ B.A.E. Portfolio | Indianapolis & Chicago',
    description: 'DJ B.A.E. gig history, featured events, club nights, festivals, and private events.',
    images: ['/photos/PlexMix19-DJBAE.JPEG'],
  },
}

export default async function PortfolioPage() {
  const [entries, featured, stats, content] = await Promise.all([
    getPortfolioEntries(),
    getFeaturedPortfolioEntries(),
    getPortfolioStats(),
    getContentMap(['instagram_url', 'instagram_posts']),
  ])
  const instagramUrl =
    content.instagram_url || SOCIALS.find((social) => social.label === 'Instagram')!.url

  const instagramPosts = parseInstagramPosts(content.instagram_posts ?? CONTENT_DEFAULTS.instagram_posts)

  const featuredWithPhotos = featured.filter((entry) => Boolean(entry.photo_url))
  const featuredIds = new Set(featuredWithPhotos.map((entry) => entry.id))
  const printEntries = [
    ...featuredWithPhotos,
    ...entries.filter((entry) => Boolean(entry.photo_url) && !featuredIds.has(entry.id)),
  ].slice(0, 3)

  return (
    <PortfolioExperienceStage
      prints={printEntries.map((entry) => ({
        id: entry.id,
        event_name: entry.event_name,
        year: entry.year,
        photo_url: entry.photo_url as string,
      }))}
      entries={entries.map((entry) => ({
        id: entry.id,
        event_name: entry.event_name,
        venue: entry.venue ?? null,
        city: entry.city,
        year: entry.year,
        tags: entry.tags ?? [],
        featured: entry.featured,
      }))}
      stats={stats}
      instagramUrl={instagramUrl}
      instagramPosts={instagramPosts}
    />
  )
}
