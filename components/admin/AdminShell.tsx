/**
 * ADMIN SHELL
 * Client wrapper for the admin layout. Manages mobile sidebar state and
 * renders the mobile top bar, slide-in sidebar, and backdrop overlay.
 */
'use client'

import { useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'

interface AdminShellProps {
  userEmail: string | undefined
  children: React.ReactNode
}

export default function AdminShell({ userEmail, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="admin-shell">
      {/* Mobile top bar */}
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
      </div>

      {/* Backdrop overlay — closes sidebar when tapped */}
      <div
        className={`admin-mobile-overlay${sidebarOpen ? ' admin-mobile-overlay--active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar — slide-in on mobile */}
      <Sidebar
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
