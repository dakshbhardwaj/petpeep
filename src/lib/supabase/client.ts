/**
 * Supabase browser client.
 *
 * Use this in Client Components ("use client") for:
 * - Supabase Auth (sign-in, sign-out, OTP)
 * - Realtime subscriptions
 * - Storage uploads from the browser
 *
 * Do NOT use this in Server Components or API routes — use server.ts instead.
 */
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
