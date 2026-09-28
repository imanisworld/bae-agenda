/**
 * ADMIN SIDEBAR
 * Branded control-room navigation for protected admin routes.
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

const GLYPHS: Record<string, string> = {
  Dashboard: 'DB',
  Bookings: 'BK',
  Events: 'EV',
  Mixes: 'LAB',
  Portfolio: 'WK',
  Clients: 'CL',
  Payments: 'PAY',
  Reviews: 'RV',
  Content: 'TXT',
  'W-9': 'W9',
}

export default function Sidebar({ userEmail, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={`admin-sidebar${isOpen ? ' admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar-brand">
        <div>
          <Link href="/admin/dashboard" className="admin-sidebar-wordmark" onClick={onClose}>
            DJ <span>B.A.E.</span>
          </Link>
          <div className="admin-sidebar-kicker">Control Room</div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close navigation" className="admin-sidebar-close">
            ×
          </button>
        )}
      </div>

      <div className="admin-sidebar-status">
        <span className="admin-sidebar-status-dot" aria-hidden="true" />
        Private workspace
      </div>

      <nav aria-label="Admin navigation" className="admin-sidebar-nav">
        {ADMIN_NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`admin-sidebar-link${isActive ? ' admin-sidebar-link--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="admin-sidebar-glyph" aria-hidden="true">
                {GLYPHS[item.label] ?? item.label.slice(0, 2).toUpperCase()}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-sidebar-public-link" onClick={onClose}>
          View public site ↗
        </Link>
        <div className="admin-sidebar-email" title={userEmail}>
          {userEmail ?? 'Admin'}
        </div>
        <form action={signOut}>
          <button type="submit" className="admin-sidebar-signout">
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
