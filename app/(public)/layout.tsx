/**
 * PUBLIC LAYOUT
 * Wraps all public-facing pages with the Nav and Footer.
 * All routes under app/(public)/ inherit this layout automatically.
 *
 * Route group (public) doesn't affect the URL — /mixes, /events, /book
 * are still at their root paths, but share this layout.
 */
import Nav          from '@/components/public/Nav'
import Footer       from '@/components/public/Footer'
import CustomCursor from '@/components/effects/CustomCursor'
import PublicPageStage from '@/components/public/PublicPageStage'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CustomCursor />
      <Nav />
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        <PublicPageStage>{children}</PublicPageStage>
      </main>
      <Footer />
    </div>
  )
}
