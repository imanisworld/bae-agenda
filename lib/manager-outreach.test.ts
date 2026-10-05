import { describe, expect, it } from 'vitest'
import { prepareManagerOutreach } from './manager-outreach'

const profile = {
  display_name: 'DJ B.A.E.',
  home_market: 'Indianapolis, IN',
  website_url: 'https://thebaeagenda.com',
  instagram_url: 'https://www.instagram.com/dj_b.a.e/',
  press_kit_url: null,
  genres: ['open format', 'hip hop', 'r&b', 'dance'],
}

const mixes = [
  {
    title: 'Sometime in July',
    genre: 'Open Format',
    description: 'A summer set, mixed live.',
    embed_url: 'https://soundcloud.com/deejaybae/plexish',
    is_featured: true,
    sort_order: 1,
  },
  {
    title: 'R&B Playlist With DonnyDon',
    genre: 'R&B · Neo Soul',
    description: 'Late-night R&B.',
    embed_url: 'https://soundcloud.com/deejaybae/r-b-1',
    is_featured: true,
    sort_order: 2,
  },
]

describe('prepareManagerOutreach', () => {
  it('uses email when a contact email exists and selects an open-format mix', () => {
    const result = prepareManagerOutreach(profile, {
      title: 'Party DJ',
      organization: 'Example Events',
      contact_email: 'bookings@example.com',
      recommended_demo: 'Open Format / Nightlife',
      why_fit: 'Strong open-format fit.',
    }, mixes)

    expect(result.channel).toBe('email')
    expect(result.subject).toContain('DJ inquiry')
    expect(result.assets.some((asset) => asset.kind === 'mix' && asset.url.includes('plexish'))).toBe(true)
    expect(result.ready).toBe(true)
  })

  it('treats job/application language as an application route', () => {
    const result = prepareManagerOutreach(profile, {
      title: 'Live Event DJ',
      organization: 'Example Co',
      source_reference: 'LinkedIn job listing',
      source_url: 'https://linkedin.com/jobs/123',
      recommended_demo: 'Open Format',
    }, mixes)

    expect(result.channel).toBe('application')
    expect(result.subject).toContain('Application')
  })

  it('flags missing targeted demo and route instead of inventing them', () => {
    const result = prepareManagerOutreach(profile, {
      title: 'Deep House Residency',
      recommended_demo: 'Deep House / Afro House',
    }, mixes)

    expect(result.channel).toBe('other')
    expect(result.missingItems).toContain('No verified contact or application route.')
    expect(result.missingItems.some((item) => item.includes('No strong published mix match'))).toBe(true)
    expect(result.ready).toBe(false)
  })

  it('flags a requested EPK when none is saved', () => {
    const result = prepareManagerOutreach(profile, {
      title: 'Festival DJ Application',
      source_url: 'https://example.com/apply',
      requirements: 'Submit EPK and mix',
      recommended_demo: 'Open Format',
    }, mixes)

    expect(result.missingItems).toContain('Press kit / EPK requested but no press-kit URL is saved.')
  })
})
