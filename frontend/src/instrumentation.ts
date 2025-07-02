export async function register() {
  // Only initialize Sentry if DSN is provided
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production') {
    try {
      if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('../sentry.server.config');
      }

      if (process.env.NEXT_RUNTIME === 'edge') {
        await import('../sentry.edge.config');
      }
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }
}

// Export onRequestError for Next.js middleware
export function onRequestError(error: any, request: any) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production') {
    try {
      // Only use Sentry if it's properly configured
      const Sentry = require('@sentry/nextjs');
      if (Sentry?.captureException) {
        Sentry.captureException(error);
      }
    } catch (sentryError) {
      console.warn('Sentry error reporting failed:', sentryError);
    }
  }
  
  // Always log the error for debugging
  console.error('Request error:', error);
}
