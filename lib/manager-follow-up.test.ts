import { describe, expect, it } from 'vitest'
import {
  buildManagerFollowUpDraft,
  defaultManagerSecondFollowUpDate,
  managerFollowUpSubject,
  managerFollowUpUrgency,
  managerTodayDate,
} from './manager-follow-up'

describe('Manager follow-up helpers', () => {
  it('classifies due and overdue dates in Indianapolis local date', () => {
    const now = new Date('2026-10-05T14:00:00Z')
    expect(managerTodayDate(now)).toBe('2026-10-05')
    expect(managerFollowUpUrgency('2026-10-04', now)).toBe('overdue')
    expect(managerFollowUpUrgency('2026-10-05', now)).toBe('due')
    expect(managerFollowUpUrgency('2026-10-06', now)).toBe('upcoming')
  })

  it('defaults a second follow-up to seven calendar days later', () => {
    expect(
      defaultManagerSecondFollowUpDate(new Date('2026-10-05T14:00:00Z'))
    ).toBe('2026-10-12')
  })

  it('builds an application-specific follow-up', () => {
    const draft = buildManagerFollowUpDraft({
      title: 'Live Event DJ',
      organization: 'Example Co',
      outreach_channel: 'application',
      status: 'applied',
    })
    expect(draft).toContain('follow up on my application')
    expect(draft).toContain('Live Event DJ')
  })

  it('keeps Re: subjects idempotent', () => {
    expect(managerFollowUpSubject({ outreach_subject: 'DJ inquiry — Example' })).toBe('Re: DJ inquiry — Example')
    expect(managerFollowUpSubject({ outreach_subject: 'Re: DJ inquiry — Example' })).toBe('Re: DJ inquiry — Example')
  })
})
