'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { sendClientPortalCodeSms } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'
import { limitPortalRequest, limitPortalSendCode, limitPortalVerifyCode } from '@/lib/ratelimit'
import {
  findPortalClientByPhone,
  formatPortalPhone,
  getPortalSessionClient,
  issuePortalCode,
  normalizePortalPhone,
  revokePortalSession,
  verifyPortalCode,
} from '@/lib/portal-auth'

function getString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export async function sendPortalCodeAction(formData: FormData) {
  const rawPhone = getString(formData, 'phone')
  const normalizedPhone = normalizePortalPhone(rawPhone)

  if (!normalizedPhone) {
    redirect('/portal/login?error=Enter a valid US phone number.')
  }

  const headerStore = await headers()
  const rateLimit = await limitPortalSendCode(headerStore, normalizedPhone)

  if (!rateLimit.success) {
    redirect(`/portal/login?error=${encodeURIComponent('Too many attempts. Please wait a few minutes and try again.')}`)
  }

  const client = await findPortalClientByPhone(normalizedPhone)

  if (client) {
    try {
      const code = await issuePortalCode(client.id, normalizedPhone, rateLimit.ip)
      const sms = await sendClientPortalCodeSms(normalizedPhone, code)

      if (!sms.ok) {
        console.error('[portal-send-code]', sms.reason, sms.detail ?? '')
        redirect(`/portal/login?error=${encodeURIComponent('Portal sign-in is temporarily unavailable. Please try again shortly.')}`)
      }
    } catch (error) {
      console.error('[portal-send-code]', error)
      redirect(`/portal/login?error=${encodeURIComponent('Portal sign-in is temporarily unavailable. Please try again shortly.')}`)
    }
  }

  redirect(`/portal/verify?phone=${encodeURIComponent(normalizedPhone)}&sent=1&masked=${encodeURIComponent(formatPortalPhone(normalizedPhone))}`)
}

export async function verifyPortalCodeAction(formData: FormData) {
  const rawPhone = getString(formData, 'phone')
  const rawCode = getString(formData, 'code').replace(/\D/g, '')
  const normalizedPhone = normalizePortalPhone(rawPhone)

  if (!normalizedPhone || rawCode.length !== 6) {
    redirect(`/portal/verify?phone=${encodeURIComponent(rawPhone)}&error=${encodeURIComponent('Enter the 6-digit code we texted you.')}`)
  }

  const headerStore = await headers()
  const rateLimit = await limitPortalVerifyCode(headerStore, normalizedPhone)

  if (!rateLimit.success) {
    redirect(`/portal/verify?phone=${encodeURIComponent(normalizedPhone)}&error=${encodeURIComponent('Too many code attempts. Please request a new code and try again.')}`)
  }

  try {
    const client = await verifyPortalCode(normalizedPhone, rawCode)
    if (!client) {
      redirect(`/portal/verify?phone=${encodeURIComponent(normalizedPhone)}&error=${encodeURIComponent('That code did not match. Please try again or request a new one.')}`)
    }
  } catch (error) {
    console.error('[portal-verify-code]', error)
    redirect(`/portal/verify?phone=${encodeURIComponent(normalizedPhone)}&error=${encodeURIComponent('We could not complete sign-in. Please try again.')}`)
  }

  redirect('/portal')
}

export async function portalSignOutAction() {
  await revokePortalSession()
  redirect('/portal/login')
}

export async function submitPortalBookingRequestAction(formData: FormData) {
  const client = await getPortalSessionClient()
  if (!client) {
    redirect('/portal/login')
  }

  const bookingId = getString(formData, 'booking_id')
  const requestType = getString(formData, 'request_type')
  const preferredContact = getString(formData, 'preferred_contact')
  const message = getString(formData, 'message')

  if (!bookingId) {
    redirect('/portal')
  }

  if (!['update', 'cancellation'].includes(requestType)) {
    redirect(`/portal/bookings/${bookingId}?request_error=${encodeURIComponent('Choose whether this is an update or cancellation request.')}`)
  }

  if (!['phone', 'email'].includes(preferredContact)) {
    redirect(`/portal/bookings/${bookingId}?request_error=${encodeURIComponent('Choose how you want the team to follow up.')}`)
  }

  if (message.length < 12) {
    redirect(`/portal/bookings/${bookingId}?request_error=${encodeURIComponent('Add a little more detail so the team knows how to help.')}`)
  }

  const headerStore = await headers()
  const rateLimit = await limitPortalRequest(headerStore, bookingId)
  if (!rateLimit.success) {
    redirect(`/portal/bookings/${bookingId}?request_error=${encodeURIComponent('Too many requests. Please wait a bit before sending another one.')}`)
  }

  const admin = createAdminClient()
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, client_id, event_name')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking || booking.client_id !== client.id) {
    redirect('/portal')
  }

  const requestInsert = await admin
    .from('booking_portal_requests')
    .insert({
      booking_id: bookingId,
      client_id: client.id,
      type: requestType as 'update' | 'cancellation',
      message,
      preferred_contact: preferredContact as 'phone' | 'email',
      status: 'new',
    })

  if (requestInsert.error) {
    console.error('[portal-booking-request]', requestInsert.error.message)
    redirect(`/portal/bookings/${bookingId}?request_error=${encodeURIComponent('We could not send your request right now. Please try again.')}`)
  }

  const noteBody = [
    `[Portal ${requestType === 'cancellation' ? 'Cancellation' : 'Update'} Request]`,
    `Client: ${client.first_name}${client.last_name ? ` ${client.last_name}` : ''}`,
    `Preferred contact: ${preferredContact}`,
    `Message: ${message}`,
  ].join('\n')

  const noteInsert = await admin
    .from('notes')
    .insert({
      booking_id: bookingId,
      client_id: client.id,
      body: noteBody,
    })

  if (noteInsert.error) {
    console.error('[portal-booking-request-note]', noteInsert.error.message)
  }

  redirect(`/portal/bookings/${bookingId}?request_success=${encodeURIComponent('Your request was sent to the DJ B.A.E. team.')}`)
}
