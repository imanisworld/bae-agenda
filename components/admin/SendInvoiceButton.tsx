'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  bookingId: string
  clientEmail?: string | null
  className?: string
  label?: string
  mode?: 'invoice' | 'reminder'
}

export default function SendInvoiceButton({
  bookingId,
  clientEmail,
  className = 'admin-btn-ghost',
  label = 'Send Invoice Email',
  mode = 'invoice',
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const sendAttemptRef = useRef<string | null>(null)
  const [status, setStatus] = useState<{ tone: 'idle' | 'success' | 'error'; message: string }>({
    tone: 'idle',
    message: '',
  })

  const disabled = isPending || !clientEmail

  function handleSend() {
    if (!clientEmail || isPending) return

    setStatus({ tone: 'idle', message: '' })
    const attemptId = sendAttemptRef.current ?? crypto.randomUUID()
    sendAttemptRef.current = attemptId

    startTransition(async () => {
      try {
        const response = await fetch(`/api/invoice/${bookingId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, attemptId }),
        })

        const data = (await response.json().catch(() => null)) as { error?: string } | null

        if (!response.ok) {
          if (response.status < 500 && response.status !== 429) {
            sendAttemptRef.current = null
          }
          setStatus({
            tone: 'error',
            message: data?.error ?? (mode === 'reminder' ? 'Unable to send invoice reminder.' : 'Unable to send invoice email.'),
          })
          return
        }

        sendAttemptRef.current = null
        setStatus({
          tone: 'success',
          message: mode === 'reminder'
            ? `Reminder sent to ${clientEmail}.`
            : `Invoice sent to ${clientEmail}.`,
        })
        router.refresh()
      } catch {
        setStatus({
          tone: 'error',
          message: mode === 'reminder' ? 'Unable to send invoice reminder.' : 'Unable to send invoice email.',
        })
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled}
        className={className}
        aria-disabled={disabled}
        title={!clientEmail ? 'Add a client email before sending an invoice.' : undefined}
        style={!clientEmail ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
      >
        {isPending ? 'Sending…' : label}
      </button>

      {!clientEmail && (
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Add a client email to send the invoice.
        </span>
      )}

      {status.message && (
        <span
          style={{
            fontSize: '12px',
            color: status.tone === 'error' ? '#fecdd3' : '#86efac',
          }}
        >
          {status.message}
        </span>
      )}
    </div>
  )
}
