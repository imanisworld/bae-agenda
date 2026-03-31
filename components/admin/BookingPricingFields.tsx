'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'

type DepositPreset = '25' | '50' | '75' | 'custom'

interface BookingPricingFieldsProps {
  defaultQuote: number | null
  defaultDepositAmount: number | null
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

function inputStyle(): CSSProperties {
  return {
    width: '100%',
    background: 'var(--off-black)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
    padding: '11px 13px',
    fontSize: '13px',
    fontFamily: 'DM Sans, sans-serif',
  }
}

function inferPreset(quote: number | null, depositAmount: number | null): DepositPreset {
  if (!quote || quote <= 0 || depositAmount === null || depositAmount === undefined) {
    return 'custom'
  }

  const percentage = Math.round((depositAmount / quote) * 100)
  if (percentage === 25 || percentage === 50 || percentage === 75) {
    return String(percentage) as DepositPreset
  }

  return 'custom'
}

function getPresetDepositAmount(quote: string, preset: DepositPreset) {
  if (preset === 'custom') return null

  const quoteValue = Number(quote)
  if (!Number.isFinite(quoteValue) || quoteValue <= 0) {
    return ''
  }

  return String(Math.round(quoteValue * (Number(preset) / 100)))
}

export default function BookingPricingFields({
  defaultQuote,
  defaultDepositAmount,
}: BookingPricingFieldsProps) {
  const [quote, setQuote] = useState<string>(defaultQuote?.toString() ?? '')
  const [depositAmount, setDepositAmount] = useState<string>(defaultDepositAmount?.toString() ?? '')
  const [depositPreset, setDepositPreset] = useState<DepositPreset>(
    inferPreset(defaultQuote, defaultDepositAmount),
  )

  const quoteValue = Number(quote)
  const depositValue = Number(depositAmount)
  const hasQuote = Number.isFinite(quoteValue) && quoteValue > 0
  const hasDeposit = Number.isFinite(depositValue) && depositValue >= 0
  const depositPercent = hasQuote && hasDeposit ? Math.round((depositValue / quoteValue) * 100) : null

  return (
    <div className="admin-form-grid-two">
      <label style={{ display: 'grid', gap: '7px' }}>
        <span className="admin-section-title">Quote</span>
        <input
          name="quote"
          type="number"
          min={0}
          step="1"
          value={quote}
          onChange={(event) => {
            const nextQuote = event.target.value
            setQuote(nextQuote)

            const nextDeposit = getPresetDepositAmount(nextQuote, depositPreset)
            if (nextDeposit !== null) {
              setDepositAmount(nextDeposit)
            }
          }}
          style={inputStyle()}
        />
      </label>

      <div style={{ display: 'grid', gap: '12px' }}>
        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="admin-section-title">Deposit Amount</span>
          <input
            name="deposit_amount"
            type="number"
            min={0}
            step="1"
            value={depositAmount}
            onChange={(event) => {
              setDepositPreset('custom')
              setDepositAmount(event.target.value)
            }}
            style={inputStyle()}
          />
        </label>

        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="muted" style={{ fontSize: '12px' }}>Deposit Preset</span>
          <select
            value={depositPreset}
            onChange={(event) => {
              const nextPreset = event.target.value as DepositPreset
              setDepositPreset(nextPreset)

              const nextDeposit = getPresetDepositAmount(quote, nextPreset)
              if (nextDeposit !== null) {
                setDepositAmount(nextDeposit)
              }
            }}
            style={inputStyle()}
          >
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <div
          className="muted"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg-sunken)',
            padding: '12px 14px',
            fontSize: '12px',
            lineHeight: 1.7,
          }}
        >
          {hasQuote && hasDeposit ? (
            <>
              Deposit is {formatCurrency(depositValue)}.
              {depositPercent !== null ? ` That is about ${depositPercent}% of the ${formatCurrency(quoteValue)} quote.` : ''}
            </>
          ) : hasQuote ? (
            <>25% = {formatCurrency(Math.round(quoteValue * 0.25))}, 50% = {formatCurrency(Math.round(quoteValue * 0.5))}, 75% = {formatCurrency(Math.round(quoteValue * 0.75))}.</>
          ) : (
            'Set the quote first to auto-fill common deposit percentages.'
          )}
        </div>
      </div>
    </div>
  )
}
