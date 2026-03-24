'use client'

import { usePathname } from 'next/navigation'

export default function PublicPageStage({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="public-page-stage">
      <div className="public-page-stage-glow" aria-hidden="true" />
      <div className="public-page-stage-scan" aria-hidden="true" />
      <div className="public-page-stage-inner">
        {children}
      </div>
    </div>
  )
}
