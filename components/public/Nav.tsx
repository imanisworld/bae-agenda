'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PUBLIC_NAV } from '@/lib/constants'
import NowPlayingPill from '@/components/public/player/NowPlayingPill'
import styles from './Nav.module.css'

// Short, readable dock labels — full names still go to aria-label and the hover tip.
const DOCK_LABELS: Record<string, string> = {
  Portfolio: 'Work',
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
          <Image
            src="/brand/dj-bae-logo.png"
            alt="DJ B.A.E."
            width={900}
            height={659}
            priority
            sizes="96px"
            className={styles.logo}
          />
        </Link>
        <span className={styles.route}>{routeLabel}</span>
        <NowPlayingPill fallback={<span className={styles.status}>Indianapolis</span>} />
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
                <span className={styles.glyph} aria-hidden="true">{DOCK_LABELS[item.label] ?? item.label}</span>
                {DOCK_LABELS[item.label] && (
                  <span className={styles.tip} aria-hidden="true">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
