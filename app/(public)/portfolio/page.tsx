import type { Metadata } from 'next'
import { getPortfolioEntries, getFeaturedPortfolioEntries, getPortfolioStats } from '@/app/actions/portfolio'
import PortfolioExperienceStage from '@/components/public/PortfolioExperienceStage'

export const metadata: Metadata = {
  title: 'Portfolio | DJ BAE Gig History — Indianapolis & Chicago',
  alternates: { canonical: '/portfolio' },
  description: 'Full gig history, featured events, and press for DJ B.A.E. — Indianapolis & Chicago DJ. Club nights, festivals, private events, and more.',
  openGraph: {
    title: 'DJ B.A.E. — Portfolio',
    description: 'From basements to festivals. Every room, every crowd.',
    url: 'https://thebaeagenda.com/portfolio',
  },
}

export default async function PortfolioPage() {
  const [entries, featured, stats] = await Promise.all([
    getPortfolioEntries(),
    getFeaturedPortfolioEntries(),
    getPortfolioStats(),
  ])

  return (
    <PortfolioExperienceStage
      prints={featured
        .filter((entry) => Boolean(entry.photo_url))
        .slice(0, 3)
        .map((entry) => ({
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
    />
  )
}
