import { describe, expect, it } from 'vitest'
import { managerAsksConfirmed, splitManagerAsks } from './manager-asks'

describe('manager asks', () => {
  it('returns no asks when requirements are blank', () => {
    expect(splitManagerAsks(null)).toEqual([])
    expect(splitManagerAsks('   ')).toEqual([])
  })

  it('splits sentences and semicolons into separate asks', () => {
    expect(
      splitManagerAsks(
        'Share DJ experience plus Instagram, website, or mixes for review. Event play time 4:30–8:00 PM; setup begins 3:30 PM; teardown through 8:30 PM.'
      )
    ).toEqual([
      'Share DJ experience plus Instagram, website, or mixes for review',
      'Event play time 4:30–8:00 PM',
      'setup begins 3:30 PM',
      'teardown through 8:30 PM',
    ])
  })

  it('splits bullet lines and keeps URLs intact', () => {
    expect(
      splitManagerAsks('- Send a 30 min mix\n2) Link thebaeagenda.com in the form\n• Availability for Nov 7')
    ).toEqual([
      'Send a 30 min mix',
      'Link thebaeagenda.com in the form',
      'Availability for Nov 7',
    ])
  })

  it('requires every ask to be confirmed', () => {
    const asks = ['Experience', 'Mixes', 'Availability']
    expect(managerAsksConfirmed(asks, ['0', '1'])).toBe(false)
    expect(managerAsksConfirmed(asks, ['2', '0', '1'])).toBe(true)
    expect(managerAsksConfirmed([], [])).toBe(false)
  })
})
