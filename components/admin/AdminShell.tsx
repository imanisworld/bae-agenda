'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'
import { useBodyScrollLock } from '@/components/hooks/useBodyScrollLock'

interface AdminShellProps {
  userEmail: string | undefined
  children: React.ReactNode
}

export default function AdminShell({ userEmail, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useBodyScrollLock(sidebarOpen)

  useEffect(() => {
    if (!sidebarOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  return (
    <div className="admin-shell">
      <div className="admin-atmosphere" aria-hidden="true" />
      <div className="admin-mobile-bar" aria-hidden={sidebarOpen}>
        <button
          className="admin-mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          aria-expanded={sidebarOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="admin-mobile-bar-brand">
          <span className="admin-mobile-brand-mark">DJ <strong>B.A.E.</strong></span>
          <span className="admin-mobile-brand-label">Control Room</span>
        </div>
        <div style={{ width: 36, flexShrink: 0 }} />
      </div>

      <div
        className={`admin-mobile-overlay${sidebarOpen ? ' admin-mobile-overlay--active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="admin-main">{children}</main>
    </div>
  )
}
