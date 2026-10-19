import type { Metadata } from 'next'
import { getPortfolioEntries, getFeaturedPortfolioEntries, getPortfolioStats } from '@/app/actions/portfolio'
import PortfolioExperienceStage from '@/components/public/PortfolioExperienceStage'
import { SOCIALS } from '@/lib/constants'
import { getContentMap } from '@/lib/db/content'
import { parseInstagramPosts } from '@/lib/instagram'
import { CONTENT_DEFAULTS } from '@/lib/content-schema'
import { getPublishedMixes } from '@/lib/db/mixes'
import { isPortfolioCategory } from '@/lib/portfolio-experience'

/** Served from cache and rebuilt in the background at most every 5 minutes; admin saves refresh it immediately (revalidatePath). */
export const revalidate = 300

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

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : {}
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category
  const initialCategory = isPortfolioCategory(rawCategory) ? rawCategory : null
  const [entries, featured, stats, content, mixes] = await Promise.all([
    getPortfolioEntries(),
    getFeaturedPortfolioEntries(),
    getPortfolioStats(),
    getContentMap(['instagram_url', 'instagram_posts']),
    getPublishedMixes(30),
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
        state: entry.state ?? null,
        year: entry.year,
        date: entry.date ?? null,
        tags: entry.tags ?? [],
        photo_url: entry.photo_url ?? null,
        featured: entry.featured,
        notes: entry.notes ?? null,
      }))}
      stats={stats}
      mixes={mixes.map((mix) => ({
        id: mix.id,
        title: mix.title,
        genre: mix.genre,
        description: mix.description,
        embed_url: mix.embed_url,
      }))}
      instagramUrl={instagramUrl}
      instagramPosts={instagramPosts}
      initialCategory={initialCategory}
    />
  )
}
