import { describe, expect, it } from 'vitest'
import { suggestEventTimeZone } from './event-form-options'

describe('event form timezone suggestions', () => {
  it('suggests Indianapolis time for Indianapolis events', () => {
    expect(suggestEventTimeZone('Indianapolis, IN')).toBe('America/Indiana/Indianapolis')
  })

  it('suggests Central time for Chicago-area events', () => {
    expect(suggestEventTimeZone('Chicago, IL')).toBe('America/Chicago')
    expect(suggestEventTimeZone('Milwaukee, WI')).toBe('America/Chicago')
  })

  it('suggests Eastern time for Atlanta events', () => {
    expect(suggestEventTimeZone('Atlanta, GA')).toBe('America/New_York')
  })

  it('requires manual choice for an unknown city', () => {
    expect(suggestEventTimeZone('Detroit, MI')).toBeNull()
  })
})
