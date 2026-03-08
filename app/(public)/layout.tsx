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

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CustomCursor />
      <Nav />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  )
}
