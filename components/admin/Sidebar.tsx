/**
 * ADMIN SIDEBAR
 * Fixed left navigation for all /admin/* routes.
 * Client component — needs usePathname for active link detection + mobile toggle.
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut } from '@/app/actions/auth'
import { ADMIN_NAV } from '@/lib/constants'

interface SidebarProps {
  userEmail: string | undefined
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────── */}
      <div className="admin-mobile-bar">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--white)',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'currentColor' }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'currentColor' }} />
          <span style={{ display: 'block', width: '14px', height: '2px', background: 'currentColor' }} />
        </button>
        <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--white)' }}>
          DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
        </div>
        <div style={{ width: '38px' }} />
      </div>

      {/* ── Overlay ─────────────────────────────────── */}
      {open && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className={`admin-sidebar${open ? ' is-open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '240px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          overflowY: 'auto',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* ── Brand ─────────────────────────────────── */}
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--white)', marginBottom: '4px' }}>
              DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Admin Panel
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="admin-sidebar-close"
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {/* ── Navigation ────────────────────────────── */}
        <nav aria-label="Admin navigation" style={{ flex: 1, padding: '12px 0' }}>
          {ADMIN_NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 24px',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: isActive ? 'var(--violet)' : 'var(--muted)',
                  background: isActive ? 'var(--violet-dim)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--violet)' : '2px solid transparent',
                  transition: 'color var(--motion-fast) var(--ease-standard), background var(--motion-fast) var(--ease-standard)',
                  fontWeight: isActive ? 500 : 300,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--white)'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  }
                }}
              >
                <span aria-hidden="true" style={{ fontSize: '14px', lineHeight: 1 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* ── Footer ────────────────────────────────── */}
        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border)' }}>
          <div
            style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.04em', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={userEmail}
          >
            {userEmail ?? 'Admin'}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              style={{
                width: '100%', padding: '9px 12px', background: 'transparent',
                border: '1px solid var(--border)', color: 'var(--muted)',
                fontFamily: 'DM Sans, sans-serif', fontSize: '10px',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                cursor: 'pointer', textAlign: 'center',
                transition: 'color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard)',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = '#e85d75'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(232,93,117,0.4)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
