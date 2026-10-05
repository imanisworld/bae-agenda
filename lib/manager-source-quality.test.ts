import { describe, expect, it } from 'vitest'
import {
  managerSourceHealthLabel,
  summarizeManagerSourceSignals,
} from './manager-source-quality'

describe('summarizeManagerSourceSignals', () => {
  it('returns no data when a source has no signals', () => {
    const summary = summarizeManagerSourceSignals([])
    expect(summary.health).toBe('no_data')
    expect(summary.yieldPercent).toBeNull()
  })

  it('marks a source productive when most signals are useful', () => {
    const summary = summarizeManagerSourceSignals(['relevant', 'converted', 'ignored'])
    expect(summary.health).toBe('productive')
    expect(summary.converted).toBe(1)
    expect(summary.yieldPercent).toBe(67)
  })

  it('marks a source noisy when ignored signals dominate', () => {
    const summary = summarizeManagerSourceSignals(['ignored', 'ignored', 'relevant'])
    expect(summary.health).toBe('noisy')
    expect(summary.ignored).toBe(2)
    expect(summary.yieldPercent).toBe(33)
  })

  it('uses readable labels', () => {
    expect(managerSourceHealthLabel('productive')).toBe('Productive')
    expect(managerSourceHealthLabel('no_data')).toBe('No data')
  })
})
