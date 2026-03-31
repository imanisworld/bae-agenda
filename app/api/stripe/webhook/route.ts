import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { syncBookingDepositState } from '@/lib/booking-deposit-sync'
import { getBookingWorkflowPaymentStatus } from '@/lib/booking-workflow'
import { getStripeClient } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET.')
  }
  return secret
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 })
  }

  const payload = await request.text()

  let event
  try {
    event = getStripeClient().webhooks.constructEvent(payload, signature, getWebhookSecret())
  } catch (error) {
    console.error('[stripe-webhook] signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = session.metadata?.bookingId

    if (bookingId) {
      const admin = createAdminClient()
      const amountTotal = typeof session.amount_total === 'number' ? session.amount_total / 100 : 0
      const paidAt = new Date().toISOString()
      const reference = session.id

      const { data: existingPayment, error: existingPaymentError } = await admin
        .from('payments')
        .select('id')
        .eq('external_reference', reference)
        .maybeSingle()

      const canUseExternalReference = !(existingPaymentError?.message ?? '').includes('column payments.external_reference does not exist')

      if (existingPayment?.id) {
        await admin
          .from('payments')
          .update({
            status: 'received',
            paid_at: paidAt,
            amount: amountTotal,
            method: 'stripe',
          })
          .eq('id', existingPayment.id)
      } else {
        await admin
          .from('payments')
          .insert({
            booking_id: bookingId,
            amount: amountTotal,
            type: 'deposit',
            method: 'stripe',
            status: 'received',
            paid_at: paidAt,
            ...(canUseExternalReference ? { external_reference: reference } : {}),
            notes: 'Confirmed by Stripe Checkout webhook.',
          })
      }

      await admin
        .from('notes')
        .insert({
          booking_id: bookingId,
          body: `Stripe deposit confirmed via webhook for $${amountTotal.toFixed(2)}.`,
        })

      await syncBookingDepositState(admin, bookingId)

      const { data: bookingForWorkflow } = await admin
        .from('bookings')
        .select('quote, deposit_amount, payments(amount, type, status)')
        .eq('id', bookingId)
        .maybeSingle()

      const { error: bookingSnapshotError } = await admin
        .from('bookings')
        .update({
          deposit_checkout_session_id: reference,
          payment_status: getBookingWorkflowPaymentStatus({
            currentStatus: 'deposit_requested',
            quote: bookingForWorkflow?.quote as number | null | undefined,
            depositAmount: bookingForWorkflow?.deposit_amount as number | null | undefined,
            lifecycleStatus: 'confirmed',
            payments: (bookingForWorkflow?.payments as Array<{
              amount: number
              type?: string | null
              status: 'pending' | 'received' | 'refunded'
            }> | null | undefined) ?? null,
          }),
          payment_method: 'stripe',
        })
        .eq('id', bookingId)

      if (bookingSnapshotError && !(bookingSnapshotError.message ?? '').includes('column bookings.deposit_checkout_session_id does not exist')) {
        console.error('[stripe-webhook] unable to save checkout session id:', bookingSnapshotError.message)
      }

      revalidatePath(`/pay/${bookingId}`)
      revalidatePath(`/admin/bookings/${bookingId}`)
      revalidatePath('/admin/bookings')
      revalidatePath('/admin/payments')
      revalidatePath('/admin/dashboard')
    }
  }

  return NextResponse.json({ received: true })
}
