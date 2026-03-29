import { track } from '@vercel/analytics/react'

type EventProperties = Record<string, string | number | boolean | null | undefined>

export function trackEvent(name: string, properties?: EventProperties) {
  try {
    track(name, properties)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[analytics] failed to track "${name}"`, error)
    }
  }
}
