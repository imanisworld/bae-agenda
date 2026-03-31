import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type LimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter: number
  disabled?: boolean
}

let redis: Redis | null | undefined
let warnedMissingRedis = false

const limiterCache = {
  notifySignup: null as Ratelimit | null,
  booking: null as Ratelimit | null,
  review: null as Ratelimit | null,
  invoiceSend: null as Ratelimit | null,
  portalSendCode: null as Ratelimit | null,
  portalVerifyCode: null as Ratelimit | null,
  portalRequest: null as Ratelimit | null,
}

function getRedisClient() {
  if (redis !== undefined) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) {
    if (!warnedMissingRedis) {
      console.warn('[ratelimit] Upstash env missing; rate limiting is disabled.')
      warnedMissingRedis = true
    }
    redis = null
    return redis
  }

  redis = new Redis({ url, token })
  return redis
}

function createLimiter(
  cacheKey: keyof typeof limiterCache,
  requests: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
  prefix: string
) {
  if (limiterCache[cacheKey]) return limiterCache[cacheKey]

  const client = getRedisClient()
  if (!client) return null

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix,
  })

  limiterCache[cacheKey] = limiter
  return limiter
}

function createRetryAfter(reset: number) {
  return Math.max(Math.ceil((reset - Date.now()) / 1000), 1)
}

async function limitByKey(
  key: string,
  limiter: Ratelimit | null
): Promise<LimitResult> {
  if (!limiter) {
    return {
      success: true,
      limit: Number.POSITIVE_INFINITY,
      remaining: Number.POSITIVE_INFINITY,
      reset: Date.now(),
      retryAfter: 0,
      disabled: true,
    }
  }

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
  const result = await limitByKey(
    ip,
    createLimiter('notifySignup', 5, '10 m', 'ratelimit:notify-signup')
  )

  return {
    ip,
    ...result,
  }
}

export async function limitBookingSubmission(headers: Headers) {
  const ip = getClientIp(headers)
  const result = await limitByKey(
    ip,
    createLimiter('booking', 5, '10 m', 'ratelimit:booking')
  )

  return {
    ip,
    ...result,
  }
}

export async function limitReviewSubmission(headers: Headers) {
  const ip = getClientIp(headers)
  const result = await limitByKey(
    ip,
    createLimiter('review', 5, '10 m', 'ratelimit:review')
  )

  return {
    ip,
    ...result,
  }
}

export async function limitInvoiceSend(headers: Headers, invoiceId: string) {
  const ip = getClientIp(headers)
  const result = await limitByKey(
    `${ip}:${invoiceId}`,
    createLimiter('invoiceSend', 5, '15 m', 'ratelimit:invoice-send')
  )

  return {
    ip,
    ...result,
  }
}

export async function limitPortalSendCode(headers: Headers, phone: string) {
  const ip = getClientIp(headers)
  const result = await limitByKey(
    `${ip}:${phone}`,
    createLimiter('portalSendCode', 5, '10 m', 'ratelimit:portal-send-code')
  )

  return {
    ip,
    ...result,
  }
}

export async function limitPortalVerifyCode(headers: Headers, phone: string) {
  const ip = getClientIp(headers)
  const result = await limitByKey(
    `${ip}:${phone}`,
    createLimiter('portalVerifyCode', 10, '10 m', 'ratelimit:portal-verify-code')
  )

  return {
    ip,
    ...result,
  }
}

export async function limitPortalRequest(headers: Headers, bookingId: string) {
  const ip = getClientIp(headers)
  const result = await limitByKey(
    `${ip}:${bookingId}`,
    createLimiter('portalRequest', 5, '30 m', 'ratelimit:portal-request')
  )

  return {
    ip,
    ...result,
  }
}
