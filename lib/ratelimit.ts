import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const notifySignupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix: 'ratelimit:notify-signup',
})

const bookingLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix: 'ratelimit:booking',
})

const reviewLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix: 'ratelimit:review',
})

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = headers.get('cf-connecting-ip')?.trim()
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'unknown'
}

export async function limitNotifySignup(headers: Headers) {
  const ip = getClientIp(headers)
  const result = await notifySignupLimiter.limit(ip)
  const retryAfter = Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1)

  return {
    ip,
    ...result,
    retryAfter,
  }
}

export async function limitBookingSubmission(headers: Headers) {
  const ip = getClientIp(headers)
  const result = await bookingLimiter.limit(ip)
  const retryAfter = Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1)

  return {
    ip,
    ...result,
    retryAfter,
  }
}

export async function limitReviewSubmission(headers: Headers) {
  const ip = getClientIp(headers)
  const result = await reviewLimiter.limit(ip)
  const retryAfter = Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1)

  return {
    ip,
    ...result,
    retryAfter,
  }
}
