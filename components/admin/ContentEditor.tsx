'use client'
/**
 * CONTENT EDITOR — Admin Client Component
 * Renders grouped editable fields for site_content.
 * Tracks dirty state per-field, saves all via server action.
 */
import { useState, useTransition } from 'react'
import { CONTENT_GROUPS }          from '@/lib/content-schema'
import { saveContentItems }        from '@/app/actions/content'
import type { ContentItem }        from '@/lib/db/content'

interface Props {
  /** Rows currently in Supabase — may be fewer than CONTENT_FIELDS */
  saved: ContentItem[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ── Input styling helper ───────────────────────────────────────────────────────

function inputStyle(changed: boolean): React.CSSProperties {
  return {
    width:       '100%',
    background:  'var(--off-black)',
    border:      `1px solid ${changed ? 'rgba(201,168,76,0.45)' : 'var(--border)'}`,
    color:       'var(--white)',
    padding:     '10px 14px',
    fontFamily:  'DM Sans, sans-serif',
    fontSize:    '13px',
    fontWeight:  300,
    lineHeight:  1.6,
    outline:     'none',
    resize:      'vertical',
    transition:  'border-color 150ms ease',
    boxSizing:   'border-box',
  } as React.CSSProperties
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContentEditor({ saved }: Props) {
  // Build initial map from saved DB rows
  const savedMap: Record<string, string> = Object.fromEntries(
    saved.map(item => [item.key, item.value ?? ''])
  )

  const [values,    setValues]    = useState<Record<string, string>>(savedMap)
  const [status,    setStatus]    = useState<SaveStatus>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')
  const [isPending, startTransition] = useTransition()

  const allFields = CONTENT_GROUPS.flatMap(g => g.fields)
  const isDirty   = allFields.some(f =>
    (values[f.key] ?? '') !== (savedMap[f.key] ?? '')
  )

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }))
    if (status === 'saved' || status === 'error') setStatus('idle')
  }

  function handleSave() {
    startTransition(async () => {
      setStatus('saving')
      const result = await saveContentItems(
        allFields.map(f => ({ key: f.key, value: values[f.key] ?? '', label: f.label }))
      )
      if (result.success) {
        // Sync savedMap so dirty indicators reset
        allFields.forEach(f => { savedMap[f.key] = values[f.key] ?? '' })
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 3500)
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? 'Save failed.')
      }
    })
  }

  return (
    <div>

      {/* ── Header bar ──────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '32px',
        gap:            '16px',
        flexWrap:       'wrap',
      }}>
        {/* Status indicator */}
        <div style={{ fontSize: '12px', letterSpacing: '0.04em', minHeight: '18px' }}>
          {status === 'saved' && (
            <span style={{ color: '#34d399' }}>✓ Saved — public site updated</span>
          )}
          {status === 'error' && (
            <span style={{ color: '#e85d75' }}>✗ {errorMsg}</span>
          )}
          {status === 'idle' && isDirty && (
            <span style={{ color: 'var(--gold)' }}>● Unsaved changes</span>
          )}
          {status === 'saving' && (
            <span style={{ color: 'var(--muted)' }}>Saving…</span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className={isDirty && !isPending ? 'admin-btn-primary' : 'admin-btn-ghost'}
          style={{
            opacity:    !isDirty || isPending ? 0.45 : 1,
            cursor:     !isDirty || isPending ? 'not-allowed' : 'pointer',
            transition: 'opacity 150ms ease',
          }}
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── Field groups ────────────────────────────────────────── */}
      {CONTENT_GROUPS.map(group => (
        <div key={group.title} className="admin-section">
          <div className="admin-section-header">
            <span className="admin-section-title">{group.title}</span>
          </div>

          <div>
            {group.fields.map((field, i) => {
              const currentVal = values[field.key] ?? ''
              const savedVal   = savedMap[field.key]  ?? ''
              const isChanged  = currentVal !== savedVal

              return (
                <div
                  key={field.key}
                  style={{
                    padding:      '20px 24px',
                    borderBottom: i < group.fields.length - 1
                      ? '1px solid var(--border)' : 'none',
                    display:             'grid',
                    gridTemplateColumns: '200px 1fr',
                    gap:                 '24px',
                    alignItems:          'start',
                  }}
                >
                  {/* Label column */}
                  <div>
                    <div style={{
                      fontSize:    '13px',
                      color:       'var(--white)',
                      marginBottom:'4px',
                      display:     'flex',
                      alignItems:  'center',
                      gap:         '7px',
                    }}>
                      {field.label}
                      {isChanged && (
                        <span style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          background: 'var(--gold)', display: 'inline-block', flexShrink: 0,
                        }} />
                      )}
                    </div>

                    <code style={{
                      fontSize:       '10px',
                      color:          'var(--muted)',
                      letterSpacing:  '0.08em',
                      fontFamily:     'monospace',
                    }}>
                      {field.key}
                    </code>

                    {field.hint && (
                      <p style={{
                        fontSize:    '11px',
                        color:       'var(--muted)',
                        marginTop:   '6px',
                        lineHeight:  1.5,
                      }}>
                        {field.hint}
                      </p>
                    )}
                  </div>

                  {/* Input column */}
                  <div>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={currentVal}
                        onChange={e => handleChange(field.key, e.target.value)}
                        rows={3}
                        placeholder={field.default || `Enter ${field.label.toLowerCase()}…`}
                        style={inputStyle(isChanged)}
                        onFocus={e => {
                          e.currentTarget.style.borderColor =
                            isChanged ? 'rgba(201,168,76,0.7)' : 'var(--violet)'
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor =
                            isChanged ? 'rgba(201,168,76,0.45)' : 'var(--border)'
                        }}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={currentVal}
                        onChange={e => handleChange(field.key, e.target.value)}
                        placeholder={field.default || `Enter ${field.label.toLowerCase()}…`}
                        style={inputStyle(isChanged)}
                        onFocus={e => {
                          e.currentTarget.style.borderColor =
                            isChanged ? 'rgba(201,168,76,0.7)' : 'var(--violet)'
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor =
                            isChanged ? 'rgba(201,168,76,0.45)' : 'var(--border)'
                        }}
                      />
                    )}

                    {/* Show default hint if field is empty */}
                    {!currentVal && field.default && (
                      <p style={{
                        marginTop:  '5px',
                        fontSize:   '10px',
                        color:      'var(--muted)',
                        letterSpacing: '0.02em',
                      }}>
                        Default: <em>{field.default}</em>
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* ── Bottom save bar ─────────────────────────────────────── */}
      {isDirty && (
        <div style={{
          marginTop:      '24px',
          display:        'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="admin-btn-primary"
            style={{ opacity: isPending ? 0.5 : 1 }}
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

    </div>
  )
}
