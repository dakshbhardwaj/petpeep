/**
 * POST /api/auth/logout
 * Signs the user out of Supabase Auth and clears the session cookie.
 */
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
