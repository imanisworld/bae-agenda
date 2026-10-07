import { describe, expect, it } from 'vitest'
import { portfolioProof, type PortfolioEventForExperience } from './portfolio-experience'

function entry(overrides: Partial<PortfolioEventForExperience>): PortfolioEventForExperience {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    event_name: overrides.event_name ?? 'Event',
    venue: overrides.venue ?? null,
    city: overrides.city ?? 'Indianapolis, IN',
    state: overrides.state ?? null,
    year: overrides.year ?? 2026,
    date: overrides.date ?? null,
    tags: overrides.tags ?? [],
    photo_url: overrides.photo_url ?? null,
    featured: overrides.featured ?? false,
    notes: overrides.notes ?? null,
  }
}

describe('portfolioProof', () => {
  it('labels explicit residency and recurring tags without inference', () => {
    const residency = entry({ id: '1', tags: ['Residency', 'Nightlife'] })
    const recurring = entry({ id: '2', tags: ['Recurring', 'Community'] })

    expect(portfolioProof(residency, [residency])).toContain('Resident DJ')
    expect(portfolioProof(recurring, [recurring])).toContain('Recurring series')
  })

  it('shows multi-year proof only for the same normalized event name', () => {
    const first = entry({ id: '1', event_name: 'Chreece Music Festival', year: 2019 })
    const second = entry({ id: '2', event_name: 'Chreece Music Festival', year: 2024 })
    const similar = entry({ id: '3', event_name: 'Spark Indy Chreece', year: 2024 })

    expect(portfolioProof(first, [first, second, similar])).toContain('2 years in archive')
    expect(portfolioProof(similar, [first, second, similar])).not.toContain('2 years in archive')
  })

  it('shows repeat venue only when the exact normalized venue repeats', () => {
    const first = entry({ id: '1', venue: 'Club Plex' })
    const second = entry({ id: '2', event_name: 'Plex Airplay', venue: 'Club Plex' })
    const other = entry({ id: '3', venue: 'Club Plex East' })

    expect(portfolioProof(first, [first, second, other])).toContain('Repeat venue')
    expect(portfolioProof(other, [first, second, other])).not.toContain('Repeat venue')
  })

  it('does not create repeat-work claims from a single ordinary entry', () => {
    const only = entry({ id: '1', event_name: 'One Drop Art Show', venue: null, tags: ['Art'] })
    expect(portfolioProof(only, [only])).toEqual([])
  })
})
