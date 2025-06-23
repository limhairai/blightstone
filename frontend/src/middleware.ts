import { NextResponse, NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getCSPHeaderWithReporting } from './lib/security/csp'

/**
 * 🔒 SECURE Middleware with JWT Authentication
 * Production-ready authentication verification
 */

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

// Define public routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') // Static files (images, fonts, etc.)
  ) {
    return NextResponse.next()
  }

  console.log(`🔒 Security middleware: ${request.method} ${pathname}`)

  // ✅ DEMO MODE: Skip JWT authentication in development with demo data
  const isDemoMode = process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDemoMode || isDevelopment) {
    console.log('🔧 Development: Skipping JWT authentication (demo mode)')
    // Still apply security headers but skip authentication
    const response = NextResponse.next()
    
    // Apply security headers
    response.headers.set('Content-Security-Policy', getCSPHeaderWithReporting())
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  }

  // PRODUCTION ONLY: JWT Authentication
  const protectedPaths = ['/dashboard', '/admin', '/api/admin', '/api/businesses', '/api/accounts']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath) {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        )
      } else {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
    
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const response = NextResponse.next()
      response.headers.set('x-user-id', payload.userId as string)
      response.headers.set('x-user-role', payload.role as string)
      response.headers.set('x-user-email', payload.email as string)
      
      // Additional admin route protection
      const adminPaths = ['/admin', '/api/admin']
      const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
      
      if (isAdminPath) {
        const userRole = payload.role as string
        if (userRole !== 'admin' && userRole !== 'superuser') {
          return pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
            : NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
      
      return response
    } catch (error) {
      console.error('JWT verification failed:', error)
      const response = pathname.startsWith('/api/') 
        ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }

  // Apply security headers for all other requests
  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', getCSPHeaderWithReporting())
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
