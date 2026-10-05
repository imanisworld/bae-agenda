import Link from 'next/link'
import type { ReactNode } from 'react'
import { PUBLIC_LEGAL_NAV } from '@/lib/constants'

interface Props {
  eyebrow: string
  title: string
  intro: ReactNode
  children: ReactNode
  currentPath: string
}

export default function UtilityPageShell({
  eyebrow,
  title,
  intro,
  children,
  currentPath,
}: Props) {
  return (
    <main className="utility-page">
      <div className="utility-page-atmosphere" aria-hidden="true" />
      <div className="utility-page-inner">
        <header className="utility-page-hero">
          <span className="utility-page-kicker">{eyebrow}</span>
          <h1>{title}</h1>
          <div className="utility-page-intro">{intro}</div>

          <nav className="utility-page-nav" aria-label="Site policies">
            {PUBLIC_LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.href === currentPath ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="utility-page-content">
          {children}
        </div>
      </div>
    </main>
  )
}

export function UtilitySection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="utility-section">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  )
}
