import { NextRequest } from 'next/server'
import { logEvent } from '@/lib/monitoring'

const MAX_BODY_BYTES = 12_000
const VALID_SOURCES = new Set(['homepage-section', 'public-route', 'global'])
const VALID_ENVIRONMENTS = new Set(['preview', 'staging', 'production'])
const VALID_SECTIONS = new Set([
  'hero',
  'mixes',
  'events',
  'photo-strip',
  'portfolio',
  'booking',
  'reviews',
  'connect',
])

function boundedString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.slice(0, maxLength) : undefined
}

function isSameOrigin(request: NextRequest) {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin') return false

  const origin = request.headers.get('origin')
  if (!origin) return false

  try {
    return new URL(origin).host === request.nextUrl.host
  } catch {
    return false
  }
}

async function readBoundedPayload(request: NextRequest) {
  if (!request.body) throw new Error('Invalid JSON')

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let body = ''
  let byteLength = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    byteLength += value.byteLength
    if (byteLength > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new RangeError('Payload too large')
    }
    body += decoder.decode(value, { stream: true })
  }

  body += decoder.decode()
  return JSON.parse(body) as Record<string, unknown>
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: 'Payload too large' }, { status: 413 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await readBoundedPayload(request)
  } catch (error) {
    if (error instanceof RangeError) {
      return Response.json({ error: 'Payload too large' }, { status: 413 })
    }
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const source = boundedString(payload.source, 40)
  const section = boundedString(payload.section, 40)
  const environment = boundedString(payload.environment, 24)
  if (!source || !VALID_SOURCES.has(source)) {
    return Response.json({ error: 'Invalid error source' }, { status: 400 })
  }
  if (!environment || !VALID_ENVIRONMENTS.has(environment)) {
    return Response.json({ error: 'Invalid deployment environment' }, { status: 400 })
  }
  if (source === 'homepage-section' && (!section || !VALID_SECTIONS.has(section))) {
    return Response.json({ error: 'Invalid homepage section' }, { status: 400 })
  }

  logEvent('error', 'client_render_error', {
    source,
    section,
    environment,
    pathname: boundedString(payload.pathname, 240),
    errorName: boundedString(payload.name, 120),
    errorMessage: boundedString(payload.message, 1_000),
    errorStack: boundedString(payload.stack, 4_000),
    componentStack: boundedString(payload.componentStack, 4_000),
    digest: boundedString(payload.digest, 160),
    browser: boundedString(request.headers.get('user-agent'), 500),
    release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 40),
  })

  return new Response(null, { status: 204 })
}
