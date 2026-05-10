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
const PUBLIC_ROUTES = ["/", "/login", "/sign-up", "/sign-up/verify", "/login/verify", "/admin-login"]
// Routes only accessible to ADMIN users
const ADMIN_ROUTES = ["/admin"]
// Routes for authenticated users only
const PROTECTED_ROUTES = [
  "/dashboard",
  "/pets",
  "/search",
  "/bookings",
  "/profile",
  "/onboarding",
  "/sitter",
  "/admin",
]

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

  // Use exact match OR path prefix with a "/" to avoid "/admin" matching "/admin-login"
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route)

  // Helper: build a redirect that carries the refreshed session cookies forward.
  // Without this, any access-token refresh that happened inside getUser() is lost
  // when a plain NextResponse.redirect() is returned, invalidating the session.
  function redirectWithCookies(destination: URL | string): NextResponse {
    const res = NextResponse.redirect(new URL(destination, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value, cookie)
    })
    return res
  }

  // Redirect unauthenticated users from protected routes to login, preserving target.
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return redirectWithCookies(loginUrl)
  }

  // Redirect authenticated users away from auth pages.
  // Honours the redirectTo param so deep links work after login/session refresh.
  if (isPublicRoute && user && (pathname === "/login" || pathname === "/sign-up")) {
    const raw = request.nextUrl.searchParams.get("redirectTo") ?? ""
    // Only allow relative paths to prevent open-redirect attacks.
    const destination = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard"
    return redirectWithCookies(destination)
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
