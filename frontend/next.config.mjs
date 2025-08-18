import {withSentryConfig} from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable problematic features for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Enforce TypeScript errors for production readiness
  },
  
  // Basic image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in dev
  },
  
  // Font optimization (using built-in Next.js font optimization)
  optimizeFonts: true,
  
  // Add headers for better font loading and security
  async headers() {
    return [
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: http://127.0.0.1:*; media-src 'self' data: https: http://127.0.0.1:*; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co http://127.0.0.1:54323 ws://127.0.0.1:54323 https://vitals.vercel-analytics.com https://vitals.vercel-insights.com; frame-src https://js.stripe.com https://vercel.live;",
          },
        ],
      },
    ];
  },
  
  // Disable features we don't need
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
};

// Only enable Sentry in production
const sentryConfig = process.env.NODE_ENV === 'production' ? {
  org: "utopia-limited",
  project: "adhub-frontend",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
  // Disable source map upload if no auth token is provided
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
} : {};

export default process.env.NODE_ENV === 'production' 
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;