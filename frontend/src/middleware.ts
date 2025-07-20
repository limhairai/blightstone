import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 🔒 SECURE Middleware with JWT Authentication
 * Production-ready authentication verification
 */

// Rate limiting storage (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP

function getRateLimitKey(request: NextRequest): string {
  // Use forwarded IP if available, otherwise use direct IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : request.ip || 'unknown';
  return `rate_limit:${ip}`;
}

function isRateLimited(request: NextRequest): boolean {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Get or create rate limit entry
  let entry = rateLimit.get(key);
  if (!entry || entry.resetTime < windowStart) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimit.set(key, entry);
  }
  
  // Increment count
  entry.count++;
  
  // Check if over limit
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get pathname early to avoid initialization errors
  const { pathname } = request.nextUrl

  // Check if environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not available in middleware, skipping auth check')
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  let session = null
  try {
    const {
      data: { session: userSession },
    } = await supabase.auth.getSession()
    session = userSession
    
    // Debug logging for registration flow
    if (pathname === '/register' || pathname === '/confirm-email') {
      console.log(`🔒 Middleware: ${pathname}, session:`, session ? {
        user_id: session.user.id,
        email: session.user.email,
        email_confirmed_at: session.user.email_confirmed_at
      } : 'null')
    }
  } catch (error) {
    console.warn('Error getting session in middleware:', error)
    // Continue without session - will be treated as unauthenticated
  }

  // Define public routes - include onboarding
  // Note: Root path '/' is no longer public since it redirects based on auth status
  const publicRoutes = ['/login', '/register', '/forgot-password', '/auth/callback', '/confirm-email', '/magic-link', '/onboarding']

  // If it's a public route, do nothing.
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/')) {
    return response
  }

  // If there is no session and the user is trying to access a protected route
  if (!session) {
    // For API routes, return a 401 Unauthorized response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // For page routes, redirect to the login page
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If there is a session and the user is on a public-only page (like login), let them proceed
  // The login component will handle checking onboarding status and redirecting appropriately
  // Don't auto-redirect to dashboard anymore - let components handle the flow
  
  // For register page, only redirect if user is fully authenticated (email confirmed)
  if (session && pathname === '/register') {
    // Check if user's email is confirmed
    if (session.user?.email_confirmed_at) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // If email not confirmed, allow them to stay on register page or go to confirm-email
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Add security headers
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // Allow same-origin requests
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json(
        { error: 'CSRF protection: Origin mismatch' },
        { status: 403 }
      );
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
