import type { MetadataRoute } from 'next'

const BASE_URL = 'https://thebaeagenda.com'

const routes = [
  '',
  '/book',
  '/connect',
  '/events',
  '/lab',
  '/meet',
  '/mixes',
  '/portfolio',
  '/press-kit',
  '/privacy',
  '/built',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/book' ? 0.9 : 0.7,
  }))
}
