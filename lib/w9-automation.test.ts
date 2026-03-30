import { afterEach, describe, expect, it } from 'vitest'
import { getW9AutoSendThreshold, shouldAutoSendW9ForPayment } from './w9-automation'

const originalThreshold = process.env.W9_AUTO_SEND_PAYMENT_THRESHOLD

afterEach(() => {
  process.env.W9_AUTO_SEND_PAYMENT_THRESHOLD = originalThreshold
})

describe('w9 automation helpers', () => {
  it('defaults the auto-send threshold to 600 dollars', () => {
    delete process.env.W9_AUTO_SEND_PAYMENT_THRESHOLD
    expect(getW9AutoSendThreshold()).toBe(600)
  })

  it('accepts an override from environment config', () => {
    process.env.W9_AUTO_SEND_PAYMENT_THRESHOLD = '750'
    expect(getW9AutoSendThreshold()).toBe(750)
  })

  it('falls back to the default when the env value is invalid', () => {
    process.env.W9_AUTO_SEND_PAYMENT_THRESHOLD = 'abc'
    expect(getW9AutoSendThreshold()).toBe(600)
  })

  it('only auto-sends for received payments at or above the threshold', () => {
    delete process.env.W9_AUTO_SEND_PAYMENT_THRESHOLD
    expect(shouldAutoSendW9ForPayment(600, 'received')).toBe(true)
    expect(shouldAutoSendW9ForPayment(599, 'received')).toBe(false)
    expect(shouldAutoSendW9ForPayment(800, 'pending')).toBe(false)
  })
})
