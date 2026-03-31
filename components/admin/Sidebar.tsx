/**
 * ADMIN SIDEBAR
 * Fixed left navigation for all /admin/* routes.
 * Client component — needs usePathname for active link detection.
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { ADMIN_NAV } from '@/lib/constants'

interface SidebarProps {
  userEmail: string | undefined
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ userEmail, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`admin-sidebar${isOpen ? ' admin-sidebar--open' : ''}`}
      style={{
        width: '240px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        overflowY: 'auto',
        paddingTop: 'var(--safe-top)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Conthrax, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--white)', marginBottom: '4px' }}>
            DJ <span style={{ color: 'var(--violet)' }}>B.A.E.</span>
          </div>
          <div style={{ fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Admin Panel
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="admin-sidebar-close"
            style={{
              display: 'none',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      <nav aria-label="Admin navigation" style={{ flex: 1, padding: '12px 0' }}>
        {ADMIN_NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
  )
}
