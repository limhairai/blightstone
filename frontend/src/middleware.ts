import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"]

// Define admin-only routes
const adminRoutes = ["/admin", "/admin/users", "/admin/settings"]

// Define team-based routes that require specific permissions
const teamRoutes = {
  "/accounts": ["view_accounts"],
  "/accounts/manage": ["manage_accounts"],
  "/analytics": ["view_analytics"],
  "/analytics/manage": ["manage_analytics"],
  "/settings": ["view_settings"],
  "/settings/manage": ["manage_settings"],
  "/team": ["view_users"],
  "/team/manage": ["manage_users"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // For protected routes, let the client-side handle authentication
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
