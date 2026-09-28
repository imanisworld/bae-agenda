import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-shell">
      <div className="portal-shell-atmosphere" aria-hidden="true" />
      <div className="portal-shell-content">{children}</div>
      <nav className="portal-shell-utility" aria-label="Client portal policies">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/accessibility">Accessibility</Link>
        <Link href="/book#contact">Contact</Link>
      </nav>
    </div>
  )
}
