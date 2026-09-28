'use client'

import { useMemo, useState } from 'react'
import type {
  PortfolioArchiveEntry,
  PortfolioArchiveMedia,
} from '@/components/public/PortfolioMediaLightbox'

function TagChip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: '10px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--violet)',
      background: 'rgba(143,45,60,0.1)',
      border: '1px solid rgba(143,45,60,0.2)',
      borderRadius: '100px',
      padding: '3px 8px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

const filterBtnBase: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '10px 18px',
  minHeight: '44px',
  borderRadius: '100px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--muted)',
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
  transition: 'border-color 200ms ease, color 200ms ease, background 200ms ease',
  whiteSpace: 'nowrap',
}

const filterBtnActive: React.CSSProperties = {
  ...filterBtnBase,
  borderColor: 'var(--violet)',
  color: 'var(--white)',
  background: 'rgba(143,45,60,0.1)',
}

const COLLAPSED_YEARS = 3

export default function PortfolioArchive({
  entries,
  media,
  onOpenEntry,
}: {
  entries: PortfolioArchiveEntry[]
  media: PortfolioArchiveMedia[]
  onOpenEntry: (entryId: string) => void
}) {
  const [city, setCity] = useState<string | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const mediaByEntry = useMemo(() => {
    const grouped = new Map<string, PortfolioArchiveMedia[]>()
    media.forEach((item) => {
      const list = grouped.get(item.portfolio_entry_id) ?? []
      list.push(item)
      grouped.set(item.portfolio_entry_id, list)
    })
    return grouped
  }, [media])

  const cities = useMemo(() => {
    const seen = new Set<string>()
    entries.forEach((e) => {
      const c = e.city.split(',')[0].trim()
      seen.add(c)
    })
    return [...seen].sort()
  }, [entries])

  const tags = useMemo(() => {
    const seen = new Set<string>()
    entries.forEach((e) => e.tags.forEach((t) => seen.add(t)))
    return [...seen].sort()
  }, [entries])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (city && !e.city.startsWith(city)) return false
      if (tag && !e.tags.includes(tag)) return false
      return true
    })
  }, [entries, city, tag])

  const allYears = useMemo(() => {
    return [...new Set(filtered.map((e) => e.year))].sort((a, b) => b - a)
  }, [filtered])

  const hasFilters = city !== null || tag !== null

  const visibleYears = useMemo(() => {
    if (expanded || hasFilters) return allYears
    return allYears.slice(0, COLLAPSED_YEARS)
  }, [allYears, expanded, hasFilters])

  function mediaPreview(entry: PortfolioArchiveEntry) {
    if (entry.photo_url) return entry.photo_url
    const items = mediaByEntry.get(entry.id) ?? []
    const image = items.find((item) => item.media_type === 'image')
    if (image) return image.media_url
    const videoPoster = items.find((item) => item.media_type === 'video' && item.poster_url)
    return videoPoster?.poster_url ?? null
  }

  function mediaCount(entry: PortfolioArchiveEntry) {
    const items = mediaByEntry.get(entry.id) ?? []
    const coverIsExtra = entry.photo_url && !items.some((item) => item.media_url === entry.photo_url)
    return items.length + (coverIsExtra ? 1 : 0)
  }

  return (
    <section style={{ marginBottom: '80px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div className="hardware-heading" style={{ marginBottom: 0 }}>
          <span className="section-label">Full Archive</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {(cities.length > 1 || tags.length > 0) && (
        <div className="portfolio-filter-bar" style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '0',
        }}>
          {cities.length > 1 && cities.map((c) => (
            <button
              key={c}
              type="button"
              style={city === c ? filterBtnActive : filterBtnBase}
              onClick={() => setCity(city === c ? null : c)}
            >
              {c}
            </button>
          ))}

          {cities.length > 1 && tags.length > 0 && (
            <span style={{ width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />
          )}

          {tags.slice(0, 12).map((t) => (
            <button
              key={t}
              type="button"
              style={tag === t ? filterBtnActive : filterBtnBase}
              onClick={() => setTag(tag === t ? null : t)}
            >
              {t}
            </button>
          ))}

          {hasFilters && (
            <button
              type="button"
              style={{ ...filterBtnBase, color: 'var(--muted)', borderColor: 'transparent' }}
              onClick={() => { setCity(null); setTag(null) }}
            >
              Clear ×
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
          No events match the selected filters.
        </div>
      ) : (
        <>
          {visibleYears.map((year) => {
            const yearEntries = filtered.filter((e) => e.year === year)
            return (
              <div
                key={year}
                className="portfolio-year-group"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'clamp(60px, 8vw, 96px) 1fr',
                  gap: '0 32px',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '32px',
                  paddingBottom: '32px',
                  alignItems: 'start',
                }}
              >
                <div className="portfolio-year-label" style={{
                  fontFamily: 'Conthrax, sans-serif',
                  fontSize: 'clamp(24px, 3.5vw, 40px)',
                  color: 'rgba(250,248,243,0.12)',
                  lineHeight: 1,
                  paddingTop: '4px',
                  position: 'sticky',
                  top: '88px',
                }}>
                  {year}
                </div>

                <div className="portfolio-year-events" style={{ display: 'grid', gap: '0', minWidth: 0 }}>
                  {yearEntries.map((entry, i) => {
                    const preview = mediaPreview(entry)
                    const count = mediaCount(entry)
                    const hasMedia = count > 0

                    return (
                      <div
                        key={entry.id}
                        className="portfolio-year-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: preview ? '68px 1fr auto' : '1fr auto',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '13px 0',
                          borderBottom: i < yearEntries.length - 1
                            ? '1px solid rgba(255,255,255,0.06)'
                            : 'none',
                        }}
                      >
                        {preview ? (
                          <button
                            type="button"
                            onClick={() => onOpenEntry(entry.id)}
                            aria-label={`Open photos and video for ${entry.event_name}`}
                            style={{
                              position: 'relative',
                              width: '68px',
                              height: '68px',
                              overflow: 'hidden',
                              padding: 0,
                              border: '1px solid rgba(255,255,255,.12)',
                              background: '#111',
                              cursor: 'pointer',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preview}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => hasMedia && onOpenEntry(entry.id)}
                          disabled={!hasMedia}
                          style={{
                            minWidth: 0,
                            padding: 0,
                            border: 0,
                            background: 'transparent',
                            color: 'inherit',
                            textAlign: 'left',
                            cursor: hasMedia ? 'pointer' : 'default',
                          }}
                        >
                          <div style={{
                            fontSize: 'clamp(13px, 1.8vw, 15px)',
                            color: entry.featured ? 'var(--white)' : 'rgba(250,248,243,0.82)',
                            fontWeight: entry.featured ? 500 : 300,
                            marginBottom: entry.tags.length ? '6px' : 0,
                            lineHeight: 1.4,
                            overflowWrap: 'anywhere',
                          }}>
                            {entry.event_name}
                            {entry.featured && (
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '8px',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: 'var(--violet)',
                                verticalAlign: 'middle',
                              }}>
                                ★
                              </span>
                            )}
                          </div>
                          {entry.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {entry.tags.slice(0, 2).map((t) => (
                                <TagChip key={t} label={t} />
                              ))}
                            </div>
                          )}
                          {hasMedia ? (
                            <span style={{
                              display: 'inline-block',
                              marginTop: '8px',
                              color: '#c4a574',
                              fontSize: '9px',
                              letterSpacing: '.14em',
                              textTransform: 'uppercase',
                            }}>
                              View media · {count}
                            </span>
                          ) : null}
                        </button>

                        <div className="portfolio-year-meta" style={{ textAlign: 'right', flexShrink: 0, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', overflowWrap: 'anywhere' }}>{entry.city}</div>
                          {entry.venue && (
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', overflowWrap: 'anywhere' }}>
                              {entry.venue}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {!hasFilters && allYears.length > COLLAPSED_YEARS && (
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '24px',
              textAlign: 'center',
            }}>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '100px',
                  padding: '9px 20px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 200ms ease, border-color 200ms ease',
                }}
              >
                {expanded ? 'Show less ↑' : `Show all ${filtered.length} events ↓`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
