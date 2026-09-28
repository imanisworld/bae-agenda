'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPrimaryBookingClient } from '@/lib/booking-client'
import { getOutstandingDeposit } from '@/lib/booking-finance'
import { syncBookingDepositState } from '@/lib/booking-deposit-sync'
import { syncComputedBookingPaymentState } from '@/lib/booking-payment-sync'
import { getAppBaseUrl, getStripeClient } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin-auth'
import type { PaymentMethod } from '@/types/index'

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function redirectToPay(bookingId: string, message: string, key: 'error' | 'success' = 'error') {
  redirect(`/pay/${bookingId}?${key}=${encodeURIComponent(message)}`)
}

function redirectToAdmin(bookingId: string, message: string, key: 'error' | 'success' = 'error') {
  redirect(`/admin/bookings/${bookingId}?${key}=${encodeURIComponent(message)}`)
}

async function updateBookingDepositCheckoutSnapshot(admin: ReturnType<typeof createAdminClient>, bookingId: string, sessionId: string) {
  const { error } = await admin
    .from('bookings')
    .update({
      deposit_status: 'pending',
      deposit_checkout_session_id: sessionId,
    })
    .eq('id', bookingId)

  if (error && !(error.message ?? '').includes('column bookings.deposit_status does not exist')) {
    console.error('[deposit-checkout] unable to save booking deposit snapshot:', error.message)
  }
}

async function getBookingDepositCheckoutSource(bookingId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      event_name,
      event_date,
      status,
      quote,
      deposit_amount,
      clients(first_name, last_name, email),
      payments(amount, status)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error('[deposit-checkout] unable to load booking:', error)
    return null
  }

  return { admin, booking: data }
}

export async function startStripeDepositCheckoutAction(formData: FormData) {
  const bookingId = optionalString(formData.get('booking_id'))
  const checkoutAttemptId = optionalString(formData.get('checkout_attempt_id'))
  if (!bookingId) {
    redirect('/book')
  }

  if (!checkoutAttemptId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutAttemptId)) {
    redirectToPay(bookingId as string, 'Refresh the page and try Stripe Checkout again.')
  }

  const loaded = await getBookingDepositCheckoutSource(bookingId as string)
  if (!loaded) {
    redirectToPay(bookingId as string, 'Could not load that booking.')
  }

  const { admin, booking } = loaded as NonNullable<typeof loaded>
  const client = getPrimaryBookingClient(booking.clients)
  const payments = (booking.payments as Array<{ amount: number; status: 'pending' | 'received' | 'refunded' }> | null) ?? null
  const depositAmount = (booking.deposit_amount as number | null) ?? null
  const outstandingDeposit = getOutstandingDeposit(depositAmount, payments)

  if (depositAmount === null || depositAmount <= 0) {
    redirectToPay(bookingId as string, 'This booking does not have a deposit configured yet.')
  }

  if (outstandingDeposit <= 0) {
    redirectToPay(bookingId as string, 'This deposit is already covered.', 'success')
  }

  let checkoutUrl: string

  try {
    const stripe = getStripeClient()
    const baseUrl = getAppBaseUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: client?.email ?? undefined,
      success_url: `${baseUrl}/pay/${bookingId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pay/${bookingId}?checkout=cancelled`,
      metadata: {
        bookingId: bookingId as string,
        paymentType: 'deposit',
      },
      payment_intent_data: {
        metadata: {
          bookingId: bookingId as string,
          paymentType: 'deposit',
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(outstandingDeposit * 100),
            product_data: {
              name: `${booking.event_name ?? 'DJ B.A.E. booking'} deposit`,
              description: `Booking ${String(bookingId).slice(0, 8).toUpperCase()} deposit payment`,
            },
          },
        },
      ],
    }, {
      idempotencyKey: `deposit-checkout:${bookingId}:${checkoutAttemptId}`,
    })

    await updateBookingDepositCheckoutSnapshot(admin, bookingId as string, session.id)
    revalidatePath(`/pay/${bookingId}`)
    checkoutUrl = session.url ?? `/pay/${bookingId}`
  } catch (error) {
    console.error('[deposit-checkout] unable to create session:', error)
    redirectToPay(bookingId as string, 'Stripe checkout is not ready yet. Please try again shortly or use the manual payment option.')
  }

  redirect(checkoutUrl)
}

const MANUAL_METHODS: PaymentMethod[] = ['zelle', 'cash_app']

export async function confirmManualDepositAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  const method = optionalString(formData.get('method'))
  const notes = optionalString(formData.get('notes'))
  const confirmationId = optionalString(formData.get('confirmation_id'))

  if (!bookingId) {
    redirect('/admin/bookings')
  }

  if (!method || !MANUAL_METHODS.includes(method as PaymentMethod)) {
    redirectToAdmin(bookingId as string, 'Choose Zelle or Cash App before confirming the deposit.')
  }

  if (!confirmationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(confirmationId)) {
    redirectToAdmin(bookingId as string, 'Refresh the page and try confirming the deposit again.')
  }

  const externalReference = `manual-deposit:${bookingId}:${confirmationId}`

  const { data: booking, error } = await admin
    .from('bookings')
    .select('status, lifecycle_status, quote, deposit_amount, payments(amount, status)')
    .eq('id', bookingId as string)
    .maybeSingle()

  if (error || !booking) {
    redirectToAdmin(bookingId as string, 'Could not load that booking.')
  }

  const bookingRecord = booking as NonNullable<typeof booking>
  const outstandingDeposit = getOutstandingDeposit(
    bookingRecord.deposit_amount as number | null,
    (bookingRecord.payments as Array<{ amount: number; status: 'pending' | 'received' | 'refunded' }> | null) ?? null
  )

  if (outstandingDeposit <= 0) {
    redirectToAdmin(bookingId as string, 'This booking deposit is already fully covered.', 'success')
  }

  const methodLabel = method === 'cash_app' ? 'Cash App' : 'Zelle'
  const { error: paymentError } = await admin
    .from('payments')
    .insert({
      booking_id: bookingId as string,
      amount: outstandingDeposit,
      type: 'deposit',
      method,
      status: 'received',
      paid_at: new Date().toISOString(),
      external_reference: externalReference,
      notes: notes ?? `Manual ${methodLabel} deposit confirmation.`,
    })

  if (paymentError) {
    if (paymentError.code === '23505') {
      const { data: existingPayment } = await admin
        .from('payments')
        .select('id')
        .eq('external_reference', externalReference)
        .maybeSingle()

      if (existingPayment?.id) {
        await syncBookingDepositState(admin, bookingId as string)
        await syncComputedBookingPaymentState(admin, bookingId as string)

        await admin
          .from('bookings')
          .update({ payment_method: method })
          .eq('id', bookingId as string)

        revalidatePath(`/admin/bookings/${bookingId}`)
        revalidatePath('/admin/bookings')
        revalidatePath('/admin/payments')
        revalidatePath('/admin/dashboard')
        revalidatePath(`/pay/${bookingId}`)
        redirectToAdmin(bookingId as string, `${methodLabel} deposit was already confirmed.`, 'success')
      }
    }

    redirectToAdmin(bookingId as string, paymentError.message || 'Unable to confirm the manual deposit.')
  }

  await syncBookingDepositState(admin, bookingId as string)
  await syncComputedBookingPaymentState(admin, bookingId as string)

  await admin
    .from('bookings')
    .update({
      payment_method: method,
    })
    .eq('id', bookingId as string)

  await admin
    .from('notes')
    .insert({
      booking_id: bookingId as string,
      body: `${methodLabel} deposit manually confirmed${notes ? `: ${notes}` : '.'}`,
    })

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/pay/${bookingId}`)
  redirectToAdmin(bookingId as string, `${methodLabel} deposit confirmed.` , 'success')
}
