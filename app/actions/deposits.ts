'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getOutstandingDeposit } from '@/lib/booking-finance'
import { syncBookingDepositState } from '@/lib/booking-deposit-sync'
import { getBookingWorkflowPaymentStatus } from '@/lib/booking-workflow'
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
      payment_status: 'deposit_requested',
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
  if (!bookingId) {
    redirect('/book')
  }

  const loaded = await getBookingDepositCheckoutSource(bookingId as string)
  if (!loaded) {
    redirectToPay(bookingId as string, 'Could not load that booking.')
  }

  const { admin, booking } = loaded as NonNullable<typeof loaded>
  const client = Array.isArray(booking.clients) ? booking.clients[0] ?? null : booking.clients
  const payments = (booking.payments as Array<{ amount: number; status: 'pending' | 'received' | 'refunded' }> | null) ?? null
  const depositAmount = (booking.deposit_amount as number | null) ?? null
  const outstandingDeposit = getOutstandingDeposit(depositAmount, payments)

  if (depositAmount === null || depositAmount <= 0) {
    redirectToPay(bookingId as string, 'This booking does not have a deposit configured yet.')
  }

  if (outstandingDeposit <= 0) {
    redirectToPay(bookingId as string, 'This deposit is already covered.', 'success')
  }

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
    })

    await updateBookingDepositCheckoutSnapshot(admin, bookingId as string, session.id)

    revalidatePath(`/pay/${bookingId}`)
    redirect(session.url ?? `/pay/${bookingId}`)
  } catch (error) {
    console.error('[deposit-checkout] unable to create session:', error)
    redirectToPay(bookingId as string, 'Stripe checkout is not ready yet. Please try again shortly or use the manual payment option.')
  }
}

const MANUAL_METHODS: PaymentMethod[] = ['zelle', 'cash_app']

export async function confirmManualDepositAction(formData: FormData) {
  await requireAdminUser()

  const admin = createAdminClient()
  const bookingId = optionalString(formData.get('booking_id'))
  const method = optionalString(formData.get('method'))
  const notes = optionalString(formData.get('notes'))

  if (!bookingId) {
    redirect('/admin/bookings')
  }

  if (!method || !MANUAL_METHODS.includes(method as PaymentMethod)) {
    redirectToAdmin(bookingId as string, 'Choose Zelle or Cash App before confirming the deposit.')
  }

  const { data: booking, error } = await admin
    .from('bookings')
    .select('quote, deposit_amount, payments(amount, status)')
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
      notes: notes ?? `Manual ${methodLabel} deposit confirmation.`,
    })

  if (paymentError) {
    redirectToAdmin(bookingId as string, paymentError.message || 'Unable to confirm the manual deposit.')
  }

  await syncBookingDepositState(admin, bookingId as string)

  await admin
    .from('bookings')
    .update({
      payment_status: getBookingWorkflowPaymentStatus({
        currentStatus: 'deposit_requested',
        quote: bookingRecord.quote as number | null,
        depositAmount: bookingRecord.deposit_amount as number | null,
        lifecycleStatus: 'confirmed',
        payments: [
          ...(((bookingRecord.payments as Array<{ amount: number; status: 'pending' | 'received' | 'refunded' }> | null) ?? [])),
          { amount: outstandingDeposit, status: 'received', type: 'deposit' },
        ],
      }),
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
