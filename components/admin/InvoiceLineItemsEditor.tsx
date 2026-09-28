'use client'

import { useMemo, useRef, useState } from 'react'
import type { InvoiceLineItem } from '@/lib/invoices'

interface Props {
  initialItems: InvoiceLineItem[]
  disabled?: boolean
}

interface EditableLineItem {
  id: string
  description: string
  quantity: string
  unitAmount: string
}

const MAX_ITEMS = 8

function makeEditable(item?: InvoiceLineItem, id = 'item-0'): EditableLineItem {
  return {
    id,
    description: item?.description ?? '',
    quantity: String(item?.quantity ?? 1),
    unitAmount: String(item?.unit_amount ?? 0),
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}

export default function InvoiceLineItemsEditor({ initialItems, disabled = false }: Props) {
  const [items, setItems] = useState<EditableLineItem[]>(() => {
    const source = initialItems.length ? initialItems : [{ description: '', quantity: 1, unit_amount: 0 }]
    return source.map((item, index) => makeEditable(item, `item-${index}`))
  })
  const nextId = useRef(initialItems.length || 1)

  const total = useMemo(
    () => items.reduce((sum, item) => {
      const quantity = Number(item.quantity)
      const unitAmount = Number(item.unitAmount)
      if (!Number.isFinite(quantity) || !Number.isFinite(unitAmount)) return sum
      return sum + quantity * unitAmount
    }, 0),
    [items]
  )

  function updateItem(id: string, patch: Partial<EditableLineItem>) {
    setItems((current) =>
      current.map((item) => item.id === id ? { ...item, ...patch } : item)
    )
  }

  function addItem() {
    setItems((current) => {
      if (current.length >= MAX_ITEMS) return current
      const id = `item-${nextId.current}`
      nextId.current += 1
      return [...current, makeEditable(undefined, id)]
    })
  }

  function removeItem(id: string) {
    setItems((current) => current.length <= 1 ? current : current.filter((item) => item.id !== id))
  }

  return (
    <section className="invoice-line-items-editor">
      <div className="invoice-line-items-heading">
        <div>
          <span className="admin-field-label">Line Items</span>
          <p>Break the invoice into services, travel, add-ons, or other charges.</p>
        </div>
        {!disabled && items.length < MAX_ITEMS && (
          <button type="button" className="admin-btn-ghost" onClick={addItem}>
            + Add Line
          </button>
        )}
      </div>

      <div className="invoice-line-items-list">
        {items.map((item, index) => {
          const quantity = Number(item.quantity)
          const unitAmount = Number(item.unitAmount)
          const lineTotal =
            Number.isFinite(quantity) && Number.isFinite(unitAmount)
              ? quantity * unitAmount
              : 0

          return (
            <div key={item.id} className="invoice-line-item-row">
              <label className="invoice-line-description">
                <span>Description</span>
                <input
                  name="line_description"
                  required
                  value={item.description}
                  disabled={disabled}
                  onChange={(event) => updateItem(item.id, { description: event.target.value })}
                  placeholder={index === 0 ? 'DJ services' : 'Travel, lighting, extra hour…'}
                />
              </label>

              <label>
                <span>Qty</span>
                <input
                  name="line_quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={item.quantity}
                  disabled={disabled}
                  onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                />
              </label>

              <label>
                <span>Rate</span>
                <input
                  name="line_unit_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={item.unitAmount}
                  disabled={disabled}
                  onChange={(event) => updateItem(item.id, { unitAmount: event.target.value })}
                />
              </label>

              <div className="invoice-line-total">
                <span>Amount</span>
                <strong>{formatCurrency(lineTotal)}</strong>
              </div>

              {!disabled && (
                <button
                  type="button"
                  className="invoice-line-remove"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                  aria-label={`Remove line item ${index + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="invoice-line-items-total">
        <span>Invoice total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </section>
  )
}
