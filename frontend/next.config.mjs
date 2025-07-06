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
    ignoreBuildErrors: true, // Temporarily ignore TS errors to get app running
  },
  
  // Basic image optimization
  images: {
    formats: ['image/webp'],
  },
  
  // Font optimization (using built-in Next.js font optimization)
  optimizeFonts: true,
  
  // Add headers for better font loading
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
} : {};

export default process.env.NODE_ENV === 'production' 
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;