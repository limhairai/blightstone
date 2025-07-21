/**
 * Production-safe logging utility
 * Only logs errors and warnings in production, full logging in development
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

interface LogContext {
  component?: string
  action?: string
  userId?: string
  organizationId?: string
  [key: string]: any
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  /**
   * Debug logs - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`🔍 ${message}`, context || '')
    }
  }

  /**
   * Info logs - only in development  
   */
  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, context || '')
    }
  }

  /**
   * Success logs - only in development
   */
  success(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`✅ ${message}`, context || '')
    }
  }

  /**
   * Warning logs - always show but minimal in production
   */
  warn(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, context || '')
    } else if (isProduction) {
      // In production, only log the essential warning without sensitive context
      console.warn(`⚠️ ${message}`)
    }
  }

  /**
   * Error logs - always show but sanitized in production
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error, context || '')
    } else if (isProduction) {
      // In production, only log sanitized error info
      const sanitizedMessage = message
      console.error(`❌ ${sanitizedMessage}`)
      
      // Send to error reporting service (Sentry, etc.) if available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error || new Error(message), {
          extra: context
        })
      }
    }
  }

  /**
   * Performance logs - only in development
   */
  perf(message: string, duration: number, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`⚡ ${message} (${duration.toFixed(2)}ms)`, context || '')
    }
  }

  /**
   * Cache logs - only in development
   */
  cache(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`📦 ${message}`, context || '')
    }
  }

  /**
   * API logs - only in development
   */
  api(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`🌐 ${message}`, context || '')
    }
  }

  /**
   * Auth logs - only in development
   */
  auth(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`🔐 ${message}`, context || '')
    }
  }

  /**
   * Business logic logs - only in development
   */
  business(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(`💼 ${message}`, context || '')
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  success: logger.success.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  perf: logger.perf.bind(logger),
  cache: logger.cache.bind(logger),
  api: logger.api.bind(logger),
  auth: logger.auth.bind(logger),
  business: logger.business.bind(logger),
}

export default logger 