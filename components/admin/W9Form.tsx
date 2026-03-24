'use client'

import { useState } from 'react'
import { saveContentItems } from '@/app/actions/content'

const FIELDS = [
  { key: 'w9_legal_name',    label: 'Legal Name',               placeholder: 'Your full legal name (as on tax return)', required: true },
  { key: 'w9_business_name', label: 'Business Name / DBA',      placeholder: 'Leave blank if same as legal name' },
  { key: 'w9_classification',label: 'Tax Classification',       placeholder: 'Individual / Sole Proprietor, LLC, etc.' },
  { key: 'w9_address',       label: 'Street Address',           placeholder: '123 Main St', required: true },
  { key: 'w9_city_state_zip',label: 'City, State, ZIP',         placeholder: 'Chicago, IL 60601', required: true },
  { key: 'w9_tax_id',        label: 'SSN or EIN',               placeholder: 'XXX-XX-XXXX  or  XX-XXXXXXX', required: true },
]

interface Props {
  saved: Record<string, string>
}

export default function W9Form({ saved }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of FIELDS) init[f.key] = saved[f.key] ?? ''
    return init
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    const updates = FIELDS.map(f => ({
      key:   f.key,
      value: values[f.key] ?? '',
      label: f.label,
    }))
    const res = await saveContentItems(updates)
    if (res.success) {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } else {
      setErrorMsg(res.error ?? 'Failed to save.')
      setStatus('error')
    }
  }

  const hasRequiredFields = FIELDS.filter(f => f.required).every(f => values[f.key]?.trim())

  return (
    <div>
      <form onSubmit={handleSave}>
        <div className="admin-section" style={{ marginBottom: '24px' }}>
          <div className="admin-section-header">
            <span className="admin-section-title">Tax Information</span>
          </div>
          <div style={{ padding: '24px' }}>
            <div className="admin-form-grid">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                    {f.label}{f.required && <span style={{ color: 'var(--violet)', marginLeft: '4px' }}>*</span>}
                  </label>
                  <input
                    type={f.key === 'w9_tax_id' ? 'password' : 'text'}
                    value={values[f.key]}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: '100%',
                      background: 'var(--bg-sunken)',
                      border: '1px solid var(--border)',
                      color: 'var(--white)',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontFamily: 'DM Sans, sans-serif',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '16px', lineHeight: 1.7 }}>
              Your tax ID is stored securely and masked in the form. It is only used to generate your W-9 PDF.
            </p>
          </div>
        </div>

        {status === 'error' && (
          <div style={{ color: '#e85d75', fontSize: '12px', marginBottom: '16px' }}>{errorMsg}</div>
        )}

        <div className="admin-form-actions">
          <button
            type="submit"
            disabled={status === 'saving' || !hasRequiredFields}
            className="admin-btn-primary"
          >
            {status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Saved' : 'Save Info'}
          </button>

          {hasRequiredFields && (
            <a
              href="/api/w9"
              download="DJ-BAE-W9.pdf"
              className="admin-btn-ghost"
            >
              Download W-9 PDF ↓
            </a>
          )}
        </div>
      </form>
    </div>
  )
}
