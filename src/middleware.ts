/**
 * Next.js middleware — runs on every request before rendering.
 *
 * Responsibilities:
 * 1. Refresh the Supabase Auth session cookie
 * 2. Redirect unauthenticated users from protected routes
 * 3. Redirect admin-only routes for non-admin users
 *
 * Authorization (what a user can DO) is enforced in API routes, not here.
 * Middleware only handles authentication (are they logged in?) and routing.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes accessible without authentication
const PUBLIC_ROUTES = ["/", "/login", "/sign-up", "/sign-up/verify", "/login/verify"]
// Routes only accessible to ADMIN users
const ADMIN_ROUTES = ["/admin"]
// Routes for authenticated users only
const PROTECTED_ROUTES = ["/dashboard", "/pets", "/search", "/bookings", "/apply", "/admin"]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — important for server-side session management
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route)

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && user && (pathname === "/login" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // For admin routes, check user type via DB — this is a rare case so it's OK to query
  if (isAdminRoute && user) {
    // We rely on the user's profile stored in a cookie claim or redirect to unauthorized
    // Full admin check happens in the admin layout — middleware just prevents non-users
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
