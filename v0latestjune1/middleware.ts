import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get user role from cookies or headers
  // This is a simplified example - in a real app, you'd verify JWT tokens or session data
  const isAdmin = request.cookies.get("isAdmin")?.value === "true"

  // FOR DEVELOPMENT: Always allow access to admin routes
  // Remove this line in production
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next()
  }

  // Protect admin routes from non-admin users
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all admin routes
    "/admin/:path*",
  ],
}
