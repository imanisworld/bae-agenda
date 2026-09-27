'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PUBLIC_NAV } from '@/lib/constants'
import styles from './Nav.module.css'

const GLYPHS: Record<string, string> = {
  Home: 'BAE',
  Events: 'EV',
  Lab: 'LAB',
  Portfolio: 'WK',
  Meet: 'ME',
  Book: 'BK',
}

const TONES = ['burgundy', 'gold', 'ink', 'copper', 'champagne', 'oxblood'] as const

export default function Nav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  const routeLabel =
    PUBLIC_NAV.find((item) => isActive(item.href))?.label ??
    (pathname.startsWith('/press-kit') ? 'Press Kit' : 'DJ B.A.E.')

  return (
    <div className={styles.chrome}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="DJ B.A.E. — Home">
          DJ <span>B.A.E.</span>
        </Link>
        <span className={styles.route}>{routeLabel}</span>
        <span className={styles.status}>Indianapolis</span>
      </div>

      <div className={styles.dockWrap}>
        <nav className={styles.dock} aria-label="Primary navigation">
          {PUBLIC_NAV.map((item, index) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`${styles.item} ${active ? styles.active : ''}`}
                data-tone={TONES[index % TONES.length]}
              >
                <span className={styles.glyph} aria-hidden="true">{GLYPHS[item.label] ?? item.label.slice(0, 2)}</span>
                <span className={styles.tip} aria-hidden="true">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
