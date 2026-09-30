import { describe, expect, it } from 'vitest'
import { MAX_INSTAGRAM_POSTS, parseInstagramPosts } from './instagram'

describe('parseInstagramPosts', () => {
  it('normalizes post and reel links, keeping order', () => {
    expect(parseInstagramPosts([
      'https://www.instagram.com/p/DAbc123/?igsh=xyz',
      'instagram.com/reel/Cq-9_z/',
      'https://www.instagram.com/dj_b.a.e/p/DQq1/',
    ].join('\n'))).toEqual([
      'https://www.instagram.com/p/DAbc123/',
      'https://www.instagram.com/reel/Cq-9_z/',
      'https://www.instagram.com/p/DQq1/',
    ])
  })

  it('ignores profile links, junk and duplicates', () => {
    expect(parseInstagramPosts([
      'https://www.instagram.com/dj_b.a.e/',
      'hello',
      'https://www.instagram.com/p/DAbc123/',
      'https://instagram.com/p/DAbc123/?utm=1',
    ].join('\n'))).toEqual(['https://www.instagram.com/p/DAbc123/'])
  })

  it('handles empty input and caps the count', () => {
    expect(parseInstagramPosts('')).toEqual([])
    expect(parseInstagramPosts(null)).toEqual([])

    const many = Array.from({ length: 20 }, (_, i) => `https://www.instagram.com/p/code${i}/`).join('\n')
    expect(parseInstagramPosts(many)).toHaveLength(MAX_INSTAGRAM_POSTS)
  })
})
