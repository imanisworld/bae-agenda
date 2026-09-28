'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'

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

function inferPercent(quote: number | null, depositAmount: number | null) {
  if (!quote || quote <= 0 || depositAmount === null || depositAmount === undefined) {
    return ''
  }

  const percentage = (depositAmount / quote) * 100
  if (!Number.isFinite(percentage)) return ''

  return Number.isInteger(percentage) ? String(percentage) : percentage.toFixed(1).replace(/\.0$/, '')
}

function getDepositAmountFromPercent(quote: string, percent: string) {
  const quoteValue = Number(quote)
  const percentValue = Number(percent)

  if (!Number.isFinite(quoteValue) || quoteValue <= 0 || !Number.isFinite(percentValue) || percentValue < 0) {
    return ''
  }

  return String(Math.round(quoteValue * (percentValue / 100)))
}

function getPercentFromDeposit(quote: string, depositAmount: string) {
  const quoteValue = Number(quote)
  const depositValue = Number(depositAmount)

  if (!Number.isFinite(quoteValue) || quoteValue <= 0 || !Number.isFinite(depositValue) || depositValue < 0) {
    return ''
  }

  const percentage = (depositValue / quoteValue) * 100
  if (!Number.isFinite(percentage)) return ''

  return Number.isInteger(percentage) ? String(percentage) : percentage.toFixed(1).replace(/\.0$/, '')
}

export default function BookingPricingFields({
  defaultQuote,
  defaultDepositAmount,
}: BookingPricingFieldsProps) {
  const [quote, setQuote] = useState<string>(defaultQuote?.toString() ?? '')
  const [depositAmount, setDepositAmount] = useState<string>(defaultDepositAmount?.toString() ?? '')
  const [depositPercent, setDepositPercent] = useState<string>(inferPercent(defaultQuote, defaultDepositAmount))

  const quoteValue = Number(quote)
  const depositValue = Number(depositAmount)
  const hasQuote = Number.isFinite(quoteValue) && quoteValue > 0
  const hasDeposit = Number.isFinite(depositValue) && depositValue >= 0
  const calculatedPercent = hasQuote && hasDeposit ? Math.round((depositValue / quoteValue) * 1000) / 10 : null

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
            if (depositPercent.trim()) {
              setDepositAmount(getDepositAmountFromPercent(nextQuote, depositPercent))
            }
          }}
          style={inputStyle()}
        />
      </label>

      <div style={{ display: 'grid', gap: '12px' }}>
        <div className="admin-form-grid-two" style={{ gap: '12px' }}>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Deposit %</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={depositPercent}
              onChange={(event) => {
                const nextPercent = event.target.value
                setDepositPercent(nextPercent)
                setDepositAmount(getDepositAmountFromPercent(quote, nextPercent))
              }}
              style={inputStyle()}
              placeholder="25"
            />
          </label>

          <div style={{ display: 'grid', gap: '7px' }}>
            <span className="muted" style={{ fontSize: '12px' }}>Quick Set</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['25', '50', '75'].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  className="admin-btn-ghost"
                  onClick={() => {
                    setDepositPercent(percent)
                    setDepositAmount(getDepositAmountFromPercent(quote, percent))
                  }}
                  style={{ minWidth: 'unset', padding: '10px 12px' }}
                >
                  {percent}%
                </button>
              ))}
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => {
                  setDepositPercent('')
                }}
                style={{ minWidth: 'unset', padding: '10px 12px' }}
              >
                Manual
              </button>
            </div>
          </div>
        </div>

        <label style={{ display: 'grid', gap: '7px' }}>
          <span className="admin-section-title">Deposit Amount</span>
          <input
            name="deposit_amount"
            type="number"
            min={0}
            step="1"
            value={depositAmount}
            onChange={(event) => {
              const nextDepositAmount = event.target.value
              setDepositAmount(nextDepositAmount)
              setDepositPercent(getPercentFromDeposit(quote, nextDepositAmount))
            }}
            style={inputStyle()}
          />
        </label>

        <div className="admin-pricing-note">
          {hasQuote && hasDeposit ? (
            <>
              Deposit is {formatCurrency(depositValue)}.
              {calculatedPercent !== null ? ` That is about ${calculatedPercent}% of the ${formatCurrency(quoteValue)} quote.` : ''}
            </>
          ) : hasQuote ? (
            <>Enter a deposit percentage to auto-calculate the amount, or type a manual amount and we will back-fill the percentage for you.</>
          ) : (
            'Set the quote first, then use a deposit percentage or manual amount.'
          )}
        </div>
      </div>
    </div>
  )
}
