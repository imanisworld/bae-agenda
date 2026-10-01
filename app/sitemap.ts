import type { MetadataRoute } from 'next'
import { getPublicEventSitemapEntries } from '@/lib/db/events'

/** Served from cache and rebuilt in the background at most every 5 minutes; admin saves refresh it immediately (revalidatePath). */
export const revalidate = 300

const BASE_URL = 'https://thebaeagenda.com'

const routes = [
  '',
  '/book',
  '/events',
  '/lab',
  '/meet',
  '/portfolio',
  '/press-kit',
  '/privacy',
  '/terms',
  '/accessibility',
  '/built',
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const eventEntries = await getPublicEventSitemapEntries()

  const staticRoutes: MetadataRoute.Sitemap = routes.map((route) => {
    const isUtilityRoute = route === '/privacy' || route === '/terms' || route === '/accessibility'

    return {
      url: `${BASE_URL}${route}`,
      // Do not emit a synthetic "last modified now" value on every request.
      // A false lastmod signal teaches crawlers to ignore the field.
      changeFrequency: route === '' || route === '/events' ? 'weekly' : 'monthly',
      priority:
        route === ''
          ? 1
          : route === '/book'
            ? 0.9
            : route === '/events'
              ? 0.8
              : isUtilityRoute
                ? 0.4
                : 0.7,
    }
  })

  const eventRoutes: MetadataRoute.Sitemap = eventEntries.map((event) => ({
    url: `${BASE_URL}/events/${event.slug}`,
    lastModified: new Date(event.updated_at),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  return [...staticRoutes, ...eventRoutes]
}
