import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'production') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/portal/', '/pay/', '/admin-demo/'],
    },
    sitemap: 'https://thebaeagenda.com/sitemap.xml',
    host: 'https://thebaeagenda.com',
  }
}
