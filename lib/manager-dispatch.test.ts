import { describe, expect, it } from 'vitest'
import {
  defaultManagerFollowUpDate,
  managerDispatchActivityType,
  managerDispatchStatus,
  renderManagerOutreachHtml,
} from './manager-dispatch'

describe('Manager controlled dispatch helpers', () => {
  it('maps applications to applied and direct outreach to contacted', () => {
    expect(managerDispatchStatus('application')).toBe('applied')
    expect(managerDispatchActivityType('application')).toBe('application')
    expect(managerDispatchStatus('email')).toBe('contacted')
    expect(managerDispatchActivityType('instagram_dm')).toBe('contact')
  })

  it('defaults follow-up to five Indianapolis calendar days later', () => {
    expect(
      defaultManagerFollowUpDate(new Date('2026-10-05T13:00:00Z'))
    ).toBe('2026-10-10')
  })

  it('escapes outreach copy before rendering email HTML', () => {
    const html = renderManagerOutreachHtml('Hi <team> & friends\nThanks')
    expect(html).toContain('Hi &lt;team&gt; &amp; friends<br />Thanks')
    expect(html).not.toContain('Hi <team>')
  })
})
