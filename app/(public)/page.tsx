import type { Metadata } from 'next'
import HeroSection from '@/components/public/HeroSection'
import HomeProofBand from '@/components/public/HomeProofBand'
import VibeExperience from '@/components/public/VibeExperience'
import { getContentMap } from '@/lib/db/content'
import { SOCIALS } from '@/lib/constants'
import { getPortfolioEntries } from '@/app/actions/portfolio'

/** Served from cache and rebuilt in the background at most every 5 minutes; admin saves refresh it immediately (revalidatePath). */
export const revalidate = 300

const SITE_URL = 'https://thebaeagenda.com'
const HOME_OG_IMAGE = '/photos/images/outside.jpg'
const HOME_TITLE = 'DJ B.A.E. | Indianapolis & Chicago DJ | The Bae Agenda'

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'The Bae Agenda',
    url: SITE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#dj-bae`,
    name: 'DJ B.A.E.',
    alternateName: 'DJ BAE',
    url: SITE_URL,
    image: `${SITE_URL}${HOME_OG_IMAGE}`,
    jobTitle: 'DJ',
    homeLocation: {
      '@type': 'Place',
      name: 'Indianapolis, Indiana',
    },
    sameAs: SOCIALS.map((social) => social.url),
  },
]

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  alternates: { canonical: '/' },
  description: 'Official DJ B.A.E. site for booking, live dates, artist info, and Bae’s in the Lab based in Indianapolis with roots in Chicago.',
  openGraph: {
    title: HOME_TITLE,
    description: 'Booking, live dates, artist info, and Bae’s in the Lab for DJ B.A.E.',
    url: SITE_URL,
    images: [{ url: HOME_OG_IMAGE, width: 1565, height: 1037, alt: 'DJ B.A.E. homepage hero image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: 'Booking, live dates, artist info, and Bae’s in the Lab for DJ B.A.E.',
    images: [HOME_OG_IMAGE],
  },
}

export default async function HomePage() {
  const [content, portfolioEntries] = await Promise.all([
    getContentMap(['hero_title', 'hero_subtitle']),
    getPortfolioEntries(),
  ])

  const publishedPortfolio = portfolioEntries.filter((entry) => entry.status === 'published')
  const cities = new Set(publishedPortfolio.map((entry) => entry.city.split(',')[0].trim())).size
  const since = publishedPortfolio.length > 0
    ? Math.min(...publishedPortfolio.map((entry) => entry.year))
    : null

  const explicitProof = publishedPortfolio.flatMap((entry) => {
    const tags = new Set(entry.tags.map((tag) => tag.trim().toLowerCase()))
    if (tags.has('residency')) return [{ label: 'Resident DJ', value: entry.event_name }]
    if (tags.has('recurring')) return [{ label: 'Recurring series', value: entry.event_name }]
    return []
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <div className="home-experience">
        <HeroSection content={{ hero_title: content.hero_title, hero_subtitle: content.hero_subtitle }} />
        <HomeProofBand
          events={publishedPortfolio.length}
          cities={cities}
          since={since}
          proof={explicitProof}
        />
        <VibeExperience />
      </div>
    </>
  )
}
