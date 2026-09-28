import type { MetadataRoute } from 'next'

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
  '/built',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    // Do not emit a synthetic "last modified now" value on every request.
    // A false lastmod signal teaches crawlers to ignore the field.
    changeFrequency: route === '' || route === '/events' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/book' ? 0.9 : route === '/events' ? 0.8 : 0.7,
  }))
}
