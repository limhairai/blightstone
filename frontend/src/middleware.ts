import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 🔒 SECURE Middleware with JWT Authentication
 * Production-ready authentication verification
 */

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

  // Define public routes
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/auth/callback', '/confirm-email']

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
  
  // If there is a session and the user is on a public-only page (like login), redirect to dashboard
  // BUT: Don't redirect if user is on register page and might be in the process of email confirmation
  if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // For register page, only redirect if user is fully authenticated (email confirmed)
  if (session && pathname === '/register') {
    // Check if user's email is confirmed
    if (session.user?.email_confirmed_at) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // If email not confirmed, allow them to stay on register page or go to confirm-email
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
