'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePlayer } from './PlayerProvider'
import styles from './NowPlayingPill.module.css'

/**
 * Top-bar "now playing" control. Appears once a visitor has started a mix and
 * they are anywhere other than the Lab (which has the full player).
 */
export default function NowPlayingPill({ fallback }: { fallback: React.ReactNode }) {
  const pathname = usePathname()
  const { current, status, engaged, toggle } = usePlayer()

  if (!engaged || !current || pathname === '/lab') return <>{fallback}</>

  const playing = status === 'playing'

  return (
    <div className={styles.pill}>
      <Link href="/lab" className={styles.track} aria-label={`Now playing: ${current.title}. Open the Lab`}>
        <span className={`${styles.disc}${playing ? ` ${styles.spinning}` : ''}`} aria-hidden="true">
          {current.cover_url ? <Image src={current.cover_url} alt="" fill sizes="24px" /> : null}
        </span>
        <span className={styles.title}>{current.title}</span>
      </Link>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggle}
        aria-label={playing ? `Pause ${current.title}` : `Play ${current.title}`}
      >
        {playing ? (
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="3" width="3" height="10" rx="1" /><rect x="9" y="3" width="3" height="10" rx="1" /></svg>
        ) : (
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5Z" /></svg>
        )}
      </button>
    </div>
  )
}
