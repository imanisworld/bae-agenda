'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'

interface AdminShellProps {
  userEmail: string | undefined
  children: React.ReactNode
}

export default function AdminShell({ userEmail, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="admin-shell">
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
          DJ <span>B.A.E.</span>
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
