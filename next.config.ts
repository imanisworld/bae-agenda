import type { NextConfig } from 'next'

const DEPLOYMENT_ENVIRONMENTS = ['local', 'preview', 'staging', 'production'] as const
type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number]

function resolveDeploymentEnvironment(): DeploymentEnvironment {
  const explicitEnvironment = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV?.trim().toLowerCase()
  if (DEPLOYMENT_ENVIRONMENTS.includes(explicitEnvironment as DeploymentEnvironment)) {
    return explicitEnvironment as DeploymentEnvironment
  }

  // VERCEL_TARGET_ENV includes custom environments (for example, "staging").
  if (process.env.VERCEL_TARGET_ENV === 'staging' || process.env.VERCEL_GIT_COMMIT_REF === 'staging') {
    return 'staging'
  }
  if (process.env.VERCEL_TARGET_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return 'production'
  }
  if (process.env.VERCEL_ENV === 'preview') return 'preview'

  return 'local'
}

const deploymentEnvironment = resolveDeploymentEnvironment()

const nextConfig: NextConfig = {
  devIndicators: false,
  // Compile one non-secret environment label into both server and client code.
  // This makes staging logs distinguishable from generic Vercel previews.
  env: {
    NEXT_PUBLIC_DEPLOYMENT_ENV: deploymentEnvironment,
  },
  turbopack: {
    root: __dirname,
  },
  // Invoice PDFs read the logo and heading font from disk at request time.
  outputFileTracingIncludes: {
    '/api/invoice/**': ['./lib/pdf-assets/**'],
  },
  async redirects() {
    return [
      { source: '/experience', destination: '/portfolio', permanent: true },
      { source: '/gigs',       destination: '/portfolio', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-Deployment-Environment', value: deploymentEnvironment },
          ...(deploymentEnvironment === 'production'
            ? []
            : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }]),
        ],
      },
      {
        source: '/portal/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        source: '/pay/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/photos/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
  images: {
    qualities: [75, 90, 95],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.sndcdn.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
