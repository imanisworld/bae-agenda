/**
 * PUBLIC LAYOUT
 * Wraps all public-facing pages with the Nav and Footer.
 * All routes under app/(public)/ inherit this layout automatically.
 *
 * Route group (public) doesn't affect the URL — /lab, /events, /book
 * are still at their root paths, but share this layout.
 */
import Nav             from '@/components/public/Nav'
import Footer          from '@/components/public/Footer'
import PublicPageStage from '@/components/public/PublicPageStage'
import StickyBookingCTA from '@/components/public/StickyBookingCTA'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <StickyBookingCTA />
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        <PublicPageStage>{children}</PublicPageStage>
      </main>
      <Footer />
    </div>
  )
}
