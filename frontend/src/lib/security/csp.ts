/**
 * Content Security Policy (CSP) Configuration
 * Prevents XSS attacks and ensures secure resource loading
 */

export interface CSPConfig {
  'default-src': string[]
  'script-src': string[]
  'style-src': string[]
  'img-src': string[]
  'font-src': string[]
  'connect-src': string[]
  'frame-src': string[]
  'object-src': string[]
  'base-uri': string[]
  'form-action': string[]
  'frame-ancestors': string[]
  'upgrade-insecure-requests': boolean
}

/**
 * Production CSP Configuration - Strict security
 */
export const PRODUCTION_CSP: CSPConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js development - remove in production with nonces
    "https://js.stripe.com",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
    "https://vercel.live"
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
    "https://fonts.googleapis.com"
  ],
  'img-src': [
    "'self'",
    "data:",
    "blob:",
    "https:",
    "https://images.unsplash.com",
    "https://avatars.githubusercontent.com",
    "https://lh3.googleusercontent.com"
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com",
    "data:"
  ],
  'connect-src': [
    "'self'",
    "https://api.stripe.com",
    "https://*.supabase.co",
    "https://vitals.vercel-analytics.com",
    "https://vitals.vercel-insights.com",
    process.env.NODE_ENV === "development" ? "ws://localhost:*" : "",
    process.env.NODE_ENV === "development" ? "http://localhost:*" : "",
    process.env.NEXT_PUBLIC_API_URL || "https://api.adhub.com",
    "https://api-staging.adhub.tech", // Explicitly allow staging API
    "https://api.adhub.com" // Explicitly allow production API
  ].filter(Boolean),
  'frame-src': [
    "'self'",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://vercel.live"
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true
}

/**
 * Development CSP Configuration - More permissive for development
 */
export const DEVELOPMENT_CSP: CSPConfig = {
  ...PRODUCTION_CSP,
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'", // Required for development
    "https://js.stripe.com",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
    "https://vercel.live"
  ],
  'connect-src': [
    "'self'",
    "https://api.stripe.com",
    "https://*.supabase.co",
    "https://vitals.vercel-analytics.com",
    "https://vitals.vercel-insights.com",
    "ws://localhost:*",
    "http://localhost:*",
    "ws://127.0.0.1:*",
    "http://127.0.0.1:*"
  ]
}

/**
 * Convert CSP config object to CSP header string
 */
export function buildCSPHeader(config: CSPConfig): string {
  const directives = Object.entries(config)
    .filter(([key, value]) => {
      // Filter out boolean directives that are false
      if (typeof value === 'boolean') {
        return value
      }
      // Filter out empty arrays
      return Array.isArray(value) && value.length > 0
    })
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return key
      }
      return `${key} ${value.join(' ')}`
    })

  return directives.join('; ')
}

/**
 * Get appropriate CSP configuration based on environment
 */
export function getCSPConfig(): CSPConfig {
  return process.env.NODE_ENV === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP
}

/**
 * Generate nonce for inline scripts (use with React 18+ and Next.js 13+)
 */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

/**
 * CSP violation reporting endpoint configuration
 */
export const CSP_REPORT_CONFIG = {
  'report-uri': '/api/security/csp-report',
  'report-to': 'csp-endpoint'
}

/**
 * Complete CSP header with reporting
 */
export function getCSPHeaderWithReporting(): string {
  const config = getCSPConfig()
  const baseCSP = buildCSPHeader(config)
  
  if (process.env.NODE_ENV === 'production') {
    return `${baseCSP}; report-uri /api/security/csp-report`
  }
  
  return baseCSP
}

/**
 * Security headers bundle
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': getCSPHeaderWithReporting(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '),
  
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Prevent search engines from indexing in development
  ...((process.env.NODE_ENV === "development") && {
    'X-Robots-Tag': 'noindex, nofollow'
  })
} 