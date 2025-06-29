export async function register() {
  // Only initialize Sentry in production
  if (process.env.NODE_ENV === 'production') {
    const Sentry = await import('@sentry/nextjs');
    
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('../sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('../sentry.edge.config');
    }
    
    // Export the Sentry function for production
    module.exports.onRequestError = Sentry.captureRequestError;
  }
}

// Fallback for development
export const onRequestError = process.env.NODE_ENV === 'production' 
  ? undefined // Will be set above in production
  : (error: any) => console.error('Request error:', error);
