import type { PaymentStatus } from '@/types/index'

const DEFAULT_W9_AUTO_SEND_THRESHOLD = 600

export function getW9AutoSendThreshold() {
  const raw = process.env.W9_AUTO_SEND_PAYMENT_THRESHOLD?.trim()
  if (!raw) return DEFAULT_W9_AUTO_SEND_THRESHOLD

  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_W9_AUTO_SEND_THRESHOLD
}

export function shouldAutoSendW9ForPayment(amount: number, status: PaymentStatus) {
  return status === 'received' && amount >= getW9AutoSendThreshold()
}
