'use client'

import { useEffect } from 'react'
import styles from './InstagramEmbeds.module.css'

type InstagramEmbedApi = { Embeds: { process: () => void } }

declare global {
  interface Window {
    instgrm?: InstagramEmbedApi
  }
}

const EMBED_SCRIPT = 'https://www.instagram.com/embed.js'

// Instagram's embed script swaps each blockquote for a sized iframe. It only
// scans once on load, so later mounts (reopening the archive) ask it again.
function processEmbeds() {
  if (window.instgrm) {
    window.instgrm.Embeds.process()
    return
  }

  if (document.querySelector(`script[src="${EMBED_SCRIPT}"]`)) return
  const script = document.createElement('script')
  script.src = EMBED_SCRIPT
  script.async = true
  document.body.appendChild(script)
}

export default function InstagramEmbeds({
  posts,
  profileUrl,
}: {
  posts: string[]
  profileUrl?: string
}) {
  useEffect(() => {
    if (posts.length > 0) processEmbeds()
  }, [posts])

  if (posts.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby="instagram-embeds-title">
      <header className={styles.header}>
        <span>Instagram</span>
        <h2 id="instagram-embeds-title">From the feed</h2>
        {profileUrl ? (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer">@dj_b.a.e</a>
        ) : null}
      </header>

      <div className={styles.row}>
        {posts.map((permalink) => (
          <div key={permalink} className={styles.card}>
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={permalink}
              data-instgrm-version="14"
            >
              <a href={permalink} target="_blank" rel="noopener noreferrer">
                View this post on Instagram
              </a>
            </blockquote>
          </div>
        ))}
      </div>
    </section>
  )
}
