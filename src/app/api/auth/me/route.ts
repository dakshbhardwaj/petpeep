/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's full profile from the database.
 * Used by client components that need the DB user (name, userType, etc.)
 * rather than just the Supabase Auth user.
 *
 * Auth: required
 * Output: { user: UserWithProfile }
 */
// Must be dynamic — uses cookies() for Supabase Auth session
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // 1. Check authentication
    const supabase = createServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Fetch DB user with profiles
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        parent: true,
        sitter: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found. Please complete sign-up." },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[GET /api/auth/me]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
