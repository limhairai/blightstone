import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      routingInstrumentation: Sentry.nextRouterInstrumentation(),
    }),
  ],
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Only enable in production or when explicitly set
  enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_DSN !== undefined,
})
