export const MAX_INSTAGRAM_POSTS = 12

/**
 * Turns the admin's "Instagram posts" box (one link per line) into canonical
 * post permalinks. Accepts /p/, /reel/ and /tv/ links, with or without query
 * strings; ignores anything else. Keeps the admin's order, drops duplicates.
 */
export function parseInstagramPosts(text: string | null | undefined): string[] {
  if (!text) return []

  const permalinks: string[] = []
  const seen = new Set<string>()

  for (const line of text.split(/[\s,]+/)) {
    const match = line.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/i)
    if (!match) continue

    const code = match[2]
    if (seen.has(code)) continue
    seen.add(code)

    permalinks.push(`https://www.instagram.com/${match[1].toLowerCase()}/${code}/`)
    if (permalinks.length === MAX_INSTAGRAM_POSTS) break
  }

  return permalinks
}
