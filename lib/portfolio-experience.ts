export type PortfolioCategory =
  | 'Nightlife'
  | 'Community + Culture'
  | 'Festival + Large Event'
  | 'Corporate + Brand'
  | 'Campus'
  | 'Private + Social'
  | 'Other'

export type PortfolioEventForExperience = {
  id: string
  event_name: string
  venue: string | null
  city: string
  state?: string | null
  year: number
  date?: string | null
  tags: string[]
  photo_url?: string | null
  featured: boolean
  notes?: string | null
}

export type RelatedListeningMix = {
  id: string
  title: string
  genre: string | null
  description: string | null
  embed_url: string | null
}

const CATEGORY_TAGS: Array<{ category: PortfolioCategory; tags: string[] }> = [
  { category: 'Nightlife', tags: ['nightlife', 'residency', 'afterparty', 'venue', 'dj battle'] },
  { category: 'Community + Culture', tags: ['community', 'cultural', 'art', 'pride', 'queer', 'market', 'nonprofit', 'juneteenth', 'youth', 'open mic', 'wellness'] },
  { category: 'Festival + Large Event', tags: ['festival', 'sports'] },
  { category: 'Corporate + Brand', tags: ['corporate'] },
  { category: 'Campus', tags: ['university', 'homecoming', 'prom'] },
  { category: 'Private + Social', tags: ['private', 'brunch', 'gala', 'silent party'] },
]

const CATEGORY_SOUND_TERMS: Record<PortfolioCategory, string[]> = {
  Nightlife: ['club', 'house', 'open format', 'hip-hop', 'r&b', 'juke', 'baile'],
  'Community + Culture': ['open format', 'r&b', 'hip-hop', 'soul', 'house'],
  'Festival + Large Event': ['open format', 'hip-hop', 'r&b', 'house', 'club'],
  'Corporate + Brand': ['open format', 'r&b', 'hip-hop', 'house'],
  Campus: ['open format', 'hip-hop', 'r&b', 'club', 'throwback'],
  'Private + Social': ['r&b', 'hip-hop', 'open format', 'throwback', 'soul'],
  Other: [],
}

function normalize(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

export function portfolioCategories(entry: Pick<PortfolioEventForExperience, 'tags'>): PortfolioCategory[] {
  const tags = entry.tags.map(normalize)
  const matches = CATEGORY_TAGS
    .filter(({ tags: candidates }) => candidates.some((candidate) => tags.includes(candidate)))
    .map(({ category }) => category)

  return matches.length > 0 ? matches : ['Other']
}

export function allPortfolioCategories(entries: PortfolioEventForExperience[]): PortfolioCategory[] {
  const present = new Set(entries.flatMap(portfolioCategories))
  const ordered = CATEGORY_TAGS.map(({ category }) => category).filter((category) => present.has(category))
  return present.has('Other') ? [...ordered, 'Other'] : ordered
}

export function portfolioProof(
  entry: PortfolioEventForExperience,
  entries: PortfolioEventForExperience[]
): string[] {
  const proof: string[] = []
  const tags = new Set(entry.tags.map(normalize))

  if (tags.has('residency')) proof.push('Resident DJ')
  else if (tags.has('recurring')) proof.push('Recurring series')

  const eventName = normalize(entry.event_name)
  const eventYears = new Set(
    entries
      .filter((candidate) => candidate.id !== entry.id && normalize(candidate.event_name) === eventName)
      .map((candidate) => candidate.year)
  )
  eventYears.add(entry.year)

  if (eventYears.size > 1) proof.push(`${eventYears.size} years in archive`)

  const venue = normalize(entry.venue)
  if (venue) {
    const venueEntries = entries.filter((candidate) => normalize(candidate.venue) === venue)
    if (venueEntries.length > 1) proof.push('Repeat venue')
  }

  return proof
}

export function relatedListening(
  entry: PortfolioEventForExperience,
  mixes: RelatedListeningMix[],
  limit = 3
): RelatedListeningMix[] {
  const categories = portfolioCategories(entry)
  const soundTerms = new Set(categories.flatMap((category) => CATEGORY_SOUND_TERMS[category]))
  const eventTerms = new Set(entry.tags.map(normalize).filter(Boolean))

  return mixes
    .map((mix) => {
      const haystack = normalize([mix.title, mix.genre, mix.description].filter(Boolean).join(' · '))
      let score = 0

      for (const term of eventTerms) {
        if (term.length > 2 && haystack.includes(term)) score += 4
      }
      for (const term of soundTerms) {
        if (haystack.includes(term)) score += 2
      }
      if (mix.genre && soundTerms.has(normalize(mix.genre))) score += 2

      return { mix, score }
    })
    .filter(({ mix, score }) => Boolean(mix.embed_url) && score > 0)
    .sort((a, b) => b.score - a.score || a.mix.title.localeCompare(b.mix.title))
    .slice(0, limit)
    .map(({ mix }) => mix)
}

export function relatedListeningHref(mix: RelatedListeningMix) {
  return mix.embed_url ? `/lab?listen=${encodeURIComponent(mix.embed_url)}` : '/lab'
}
