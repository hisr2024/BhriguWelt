/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker production builds
  output: 'standalone',
  // Empty turbopack config to enable Turbopack in Next.js 16+
  turbopack: {},
  typescript: {
    // Fail build on TypeScript errors to ensure type safety
    ignoreBuildErrors: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT || '120000',
  },

  // CDN Configuration
  // Set NEXT_PUBLIC_CDN_URL in production to serve static assets from CDN
  assetPrefix: process.env.NEXT_PUBLIC_CDN_URL || '',

  // Image optimization with CDN support
  images: {
    // Add CDN domains for image optimization
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.bhriguwelt.com',
      },
    ],
    // Image optimization settings
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Compression
  compress: true,

  // Performance optimizations
  // Note: swcMinify is enabled by default in Next.js 13+ and removed in 15+
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  async headers() {
    // Get CDN URL for CSP
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';

    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${cdnUrl}`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${cdnUrl}`,
      `img-src 'self' data: https: ${cdnUrl}`,
      `font-src 'self' data: https://fonts.gstatic.com ${cdnUrl}`,
      "connect-src 'self' http: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      // Static assets - long cache for immutable files
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
}

module.exports = withBundleAnalyzer(nextConfig)
