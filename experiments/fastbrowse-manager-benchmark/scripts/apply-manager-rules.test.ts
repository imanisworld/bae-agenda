import { describe, expect, it } from 'vitest'
import {
  buildDuplicateGroups,
  isFalsePositive,
  isUsefulLead,
  scoreBenchmark,
  unsupportedFields,
  type ObservedLead,
  type ScoringProfile,
} from './apply-manager-rules'

const profile: ScoringProfile = {
  home_market: 'Indianapolis, IN',
  minimum_fee: 150,
  target_hourly_rate: 300,
  max_drive_minutes: 90,
  preferred_event_types: ['lounge'],
  excluded_event_types: [],
  genres: ['open format'],
}

function lead(overrides: Partial<ObservedLead> = {}): ObservedLead {
  return {
    id: 'lead-1',
    task_id: 't1-indy-opportunities',
    title: 'Guest DJ call',
    organization: 'Example Venue',
    venue_name: 'Example Venue',
    location_city: 'Indianapolis',
    location_state: 'IN',
    event_date: '2026-11-01',
    application_deadline: null,
    compensation_min: 200,
    compensation_max: 200,
    requirements: 'Send a mix link.',
    contact_name: null,
    contact_email: 'bookings@example.com',
    contact_phone: null,
    source_url: 'https://example.com/dj-call',
    source_kind: 'venue',
    signal_type: 'booking_call',
    actionable: true,
    classification: 'direct_buyer',
    activity: 'active',
    recurring_label: false,
    presented_as_useful: true,
    duplicate_of: null,
    same_url_is_distinct_event: false,
    why_fit: 'Open format lounge night.',
    evidence: [
      { field: 'organization', quote: 'Example Venue is booking a guest DJ.', url: 'https://example.com/dj-call' },
      { field: 'venue_name', quote: 'Example Venue is booking a guest DJ.', url: 'https://example.com/dj-call' },
      { field: 'event_date', quote: 'November 1, 2026.', url: 'https://example.com/dj-call' },
      { field: 'compensation_min', quote: 'Pay is $200.', url: 'https://example.com/dj-call' },
      { field: 'compensation_max', quote: 'Pay is $200.', url: 'https://example.com/dj-call' },
      { field: 'requirements', quote: 'Send a mix link.', url: 'https://example.com/dj-call' },
      { field: 'contact_email', quote: 'Email bookings@example.com.', url: 'https://example.com/dj-call' },
    ],
    ...overrides,
  }
}

describe('fastbrowse benchmark scorer', () => {
  it('counts a quoted direct-buyer lead as useful and leaves unknown pay unpunished', () => {
    const sparse = lead({
      compensation_min: null,
      compensation_max: null,
      evidence: lead().evidence.filter((item) => !item.field.startsWith('compensation')),
    })
    expect(isUsefulLead(sparse)).toBe(true)
    expect(unsupportedFields(sparse)).toEqual([])
  })

  it('counts pay without a quote as an invented detail and not a useful lead', () => {
    const invented = lead({
      evidence: lead().evidence.filter((item) => item.field !== 'compensation_min' && item.field !== 'compensation_max'),
    })
    expect(unsupportedFields(invented)).toEqual(['compensation_min', 'compensation_max'])
    expect(isUsefulLead(invented)).toBe(false)
  })

  it('flags an excluded staffing listing that is presented as useful', () => {
    const staffing = lead({
      id: 'staffing',
      classification: 'staffing_or_roster',
      source_kind: 'agency',
      signal_type: 'job',
    })
    expect(isFalsePositive(staffing, true)).toBe(true)
  })

  it('groups same-url repeats and refuses to merge different organizers', () => {
    const groups = buildDuplicateGroups([
      lead({ id: 'fringe-a', source_url: 'https://indyfringe.org/for-artists/' }),
      lead({ id: 'fringe-b', source_url: 'https://indyfringe.org/for-artists', organization: 'IndyFringe' }),
      lead({
        id: 'sunday',
        source_url: 'https://www.eventbrite.com/e/art-soul-sunday',
        organization: 'Social Haus Rentals',
        duplicate_of: 'program',
      }),
      lead({
        id: 'program',
        source_url: 'https://indyarts.org/programs/art-soul',
        organization: 'Indy Arts Council',
      }),
    ])
    expect(groups).toEqual([['fringe-a', 'fringe-b']])
  })

  it('does not treat different events on one calendar URL as reposts', () => {
    const groups = buildDuplicateGroups([
      lead({
        id: 'glotaku',
        title: 'Glotaku Gotta Rave Em All',
        source_url: 'https://www.themonsterzinc.com/monsterz-inc-events',
        same_url_is_distinct_event: true,
      }),
      lead({
        id: 'transylvania',
        title: 'Transylvania Halloween',
        source_url: 'https://www.themonsterzinc.com/monsterz-inc-events',
        same_url_is_distinct_event: true,
      }),
    ])
    expect(groups).toEqual([])
  })

  it('marks an active label on a past date as a false positive', () => {
    const expired = lead({ activity: 'active', event_date: '2026-10-09' })
    expect(isFalsePositive(expired, false)).toBe(true)
    const metrics = scoreBenchmark(profile, [expired])
    expect(metrics.totals.false_positives).toBe(1)
    expect(metrics.totals.stale_or_expired).toBe(1)
    expect(metrics.totals.useful_leads).toBe(0)
  })
})
