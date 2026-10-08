import { describe, expect, it } from 'vitest'
import { portfolioProof, type PortfolioEventForExperience } from './portfolio-experience'

function entry(overrides: Partial<PortfolioEventForExperience>): PortfolioEventForExperience {
  return {
    id: overrides.id ?? 'entry',
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
  it('uses explicit residency and recurring tags', () => {
    const residency = entry({ id: '1', tags: ['Residency', 'Nightlife'] })
    const recurring = entry({ id: '2', tags: ['Recurring', 'Community'] })

    expect(portfolioProof(residency, [residency])).toContain('Resident DJ')
    expect(portfolioProof(recurring, [recurring])).toContain('Recurring series')
  })

  it('uses exact normalized event names for multi-year proof', () => {
    const first = entry({ id: '1', event_name: 'Chreece Music Festival', year: 2019 })
    const second = entry({ id: '2', event_name: 'Chreece Music Festival', year: 2024 })
    const similar = entry({ id: '3', event_name: 'Spark Indy Chreece', year: 2024 })

    expect(portfolioProof(first, [first, second, similar])).toContain('2 years in archive')
    expect(portfolioProof(similar, [first, second, similar])).not.toContain('2 years in archive')
  })

  it('uses exact normalized venue names for repeat venue proof', () => {
    const first = entry({ id: '1', venue: 'Club Plex' })
    const second = entry({ id: '2', event_name: 'Plex Airplay', venue: 'Club Plex' })
    const other = entry({ id: '3', venue: 'Club Plex East' })

    expect(portfolioProof(first, [first, second, other])).toContain('Repeat venue')
    expect(portfolioProof(other, [first, second, other])).not.toContain('Repeat venue')
  })

  it('makes no repeat-work claim from one ordinary entry', () => {
    const only = entry({ id: '1', event_name: 'One Drop Art Show', tags: ['Art'] })
    expect(portfolioProof(only, [only])).toEqual([])
  })
})
