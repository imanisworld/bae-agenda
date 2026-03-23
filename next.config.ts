import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/experience', destination: '/portfolio', permanent: true },
      { source: '/gigs',       destination: '/portfolio', permanent: true },
    ]
  },

  async headers() {
    return [
      // ── Security headers (all routes) ──────────────────────────────
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',             value: 'DENY' },
          { key: 'X-Content-Type-Options',       value: 'nosniff' },
          { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',           value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
        ],
      },

      // ── Fonts — immutable, 1-year cache ────────────────────────────
      // Filenames never change; safe to cache forever in browsers.
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // ── Photos — 7-day cache with stale-while-revalidate ───────────
      // Not content-hashed, so avoid immutable. 7 days covers most visitors
      // while keeping stale content off screens within a week of updates.
      {
        source: '/photos/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ]
  },

  images: {
    // Allow Next.js Image optimisation for external photo URLs stored in
    // the database (e.g. Supabase Storage, Cloudinary). Add your specific
    // hostname(s) here — keeping this list tight is a security best practice.
    remotePatterns: [
      // Supabase Storage — replace <project-ref> with your actual project ref
      // e.g. "abcdefghijklmn.supabase.co"
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase custom domains if configured
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
