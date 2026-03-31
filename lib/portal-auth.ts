import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

const PORTAL_COOKIE_NAME = 'bae_portal_session'
const PORTAL_CODE_TTL_MINUTES = 10
const PORTAL_SESSION_TTL_DAYS = 14

type PortalSessionClient = {
  id: string
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
}

function nowPlusMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

function nowPlusDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60_000)
}

export function normalizePortalPhone(value: string) {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 10) {
    return `+1${digits}`
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  return null
}

export function formatPortalPhone(phone: string | null | undefined) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  return phone
}

function hashValue(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')

  if (leftBuffer.length !== rightBuffer.length) return false

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function generatePortalCode() {
  return String(randomInt(100000, 1000000))
}

function generatePortalToken() {
  return randomBytes(32).toString('hex')
}

export async function findPortalClientByPhone(phone: string): Promise<PortalSessionClient | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('clients')
    .select('id, first_name, last_name, email, phone')
    .eq('phone', phone)
    .maybeSingle()

  return (data as PortalSessionClient | null) ?? null
}

export async function issuePortalCode(clientId: string, phone: string, requestIp: string | null) {
  const admin = createAdminClient()
  const code = generatePortalCode()
  const codeHash = hashValue(code)

  await admin
    .from('client_portal_codes')
    .delete()
    .eq('client_id', clientId)
    .is('consumed_at', null)

  const { error } = await admin.from('client_portal_codes').insert({
    client_id: clientId,
    phone,
    code_hash: codeHash,
    expires_at: nowPlusMinutes(PORTAL_CODE_TTL_MINUTES),
    request_ip: requestIp,
  })

  if (error) {
    throw new Error(error.message || 'Unable to create portal code.')
  }

  return code
}

export async function verifyPortalCode(phone: string, code: string) {
  const admin = createAdminClient()
  const client = await findPortalClientByPhone(phone)
  if (!client) return null

  const { data, error } = await admin
    .from('client_portal_codes')
    .select('id, code_hash, expires_at, consumed_at')
    .eq('client_id', client.id)
    .eq('phone', phone)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const expiresAt = new Date(data.expires_at)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return null
  }

  const attemptedHash = hashValue(code)
  if (!safeEqualHex(data.code_hash, attemptedHash)) {
    return null
  }

  const token = generatePortalToken()
  const tokenHash = hashValue(token)

  const [{ error: consumeError }, { error: sessionError }] = await Promise.all([
    admin
      .from('client_portal_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', data.id),
    admin
      .from('client_portal_sessions')
      .insert({
        client_id: client.id,
        token_hash: tokenHash,
        expires_at: nowPlusDays(PORTAL_SESSION_TTL_DAYS).toISOString(),
        last_seen_at: new Date().toISOString(),
      }),
  ])

  if (consumeError) {
    throw new Error(consumeError.message || 'Unable to consume portal code.')
  }

  if (sessionError) {
    throw new Error(sessionError.message || 'Unable to create portal session.')
  }

  const cookieStore = await cookies()
  cookieStore.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: nowPlusDays(PORTAL_SESSION_TTL_DAYS),
  })

  return client
}

export async function getPortalSessionClient() {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(PORTAL_COOKIE_NAME)?.value
  if (!rawToken) return null

  const tokenHash = hashValue(rawToken)
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('client_portal_sessions')
    .select(`
      id,
      expires_at,
      revoked_at,
      client:clients(id, first_name, last_name, email, phone)
    `)
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const expiresAt = new Date(data.expires_at)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    await revokePortalSession()
    return null
  }

  await admin
    .from('client_portal_sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', data.id)

  const client = Array.isArray(data.client) ? data.client[0] ?? null : data.client
  return (client as PortalSessionClient | null) ?? null
}

export async function requirePortalSessionClient() {
  const client = await getPortalSessionClient()
  if (!client) {
    redirect('/portal/login')
  }

  return client
}

export async function revokePortalSession() {
  const cookieStore = await cookies()
  const rawToken = cookieStore.get(PORTAL_COOKIE_NAME)?.value

  if (rawToken) {
    const tokenHash = hashValue(rawToken)
    const admin = createAdminClient()
    await admin
      .from('client_portal_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
  }

  cookieStore.delete(PORTAL_COOKIE_NAME)
}
