/**
 * Supabase server client.
 *
 * Use this in:
 * - Server Components
 * - API route handlers
 * - Server Actions
 * - Middleware
 *
 * Always use getUser() (not getSession()) — getUser() validates
 * the JWT against Supabase Auth, getSession() only reads the cookie.
 */
import { createServerClient as _createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createServerClient() {
  const cookieStore = cookies()

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — cookies are read-only.
            // This is expected when reading auth state in a Server Component.
          }
        },
      },
    }
  )
}
