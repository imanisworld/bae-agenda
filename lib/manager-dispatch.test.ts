import { describe, expect, it } from 'vitest'
import {
  defaultManagerFollowUpDate,
  managerDispatchActivityType,
  managerDispatchStatus,
  managerRecordedMessage,
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

describe('managerRecordedMessage', () => {
  it('records the edited text for outreach sent outside Manager', () => {
    expect(managerRecordedMessage('web_form', 'Saved draft', 'What I sent\r\n')).toEqual({
      body: 'What I sent',
      source: 'as_sent',
      edited: true,
    })
  })

  it('falls back to the saved draft when nothing was pasted', () => {
    expect(managerRecordedMessage('instagram_dm', 'Saved draft', '  ')).toMatchObject({
      body: 'Saved draft',
      source: 'saved_draft',
      edited: false,
    })
  })

  it('always records the saved draft for email, since that is what Manager sends', () => {
    expect(managerRecordedMessage('email', 'Saved draft', 'Something else').body).toBe('Saved draft')
  })
})
