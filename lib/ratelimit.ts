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

const invoiceSendLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:invoice-send',
})

function createRetryAfter(reset: number) {
  return Math.max(Math.ceil((reset - Date.now()) / 1000), 1)
}

async function limitByKey(
  key: string,
  limiter: Ratelimit
) {
  const result = await limiter.limit(key)

  return {
    ...result,
    retryAfter: createRetryAfter(result.reset),
  }
}

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
  const result = await limitByKey(ip, notifySignupLimiter)

  return {
    ip,
    ...result,
  }
}

export async function limitBookingSubmission(headers: Headers) {
  const ip = getClientIp(headers)
  const result = await limitByKey(ip, bookingLimiter)

  return {
    ip,
    ...result,
  }
}

export async function limitReviewSubmission(headers: Headers) {
  const ip = getClientIp(headers)
  const result = await limitByKey(ip, reviewLimiter)

  return {
    ip,
    ...result,
  }
}

export async function limitInvoiceSend(headers: Headers, invoiceId: string) {
  const ip = getClientIp(headers)
  const result = await limitByKey(`${ip}:${invoiceId}`, invoiceSendLimiter)

  return {
    ip,
    ...result,
  }
}
