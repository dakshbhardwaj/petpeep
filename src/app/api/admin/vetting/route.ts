/**
 * GET /api/admin/vetting
 *
 * Returns a paginated list of sitter applications filtered by status.
 * Admin only.
 *
 * Query params: status (PENDING | ID_REVIEW | QUIZ_FAILED | APPROVED | REJECTED)
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Admin check
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { userType: true },
    })

    if (user?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") ?? "PENDING"

    const applications = await prisma.sitterApplication.findMany({
      where: { status: status as never },
      orderBy: { createdAt: "desc" },
      include: {
        sitter: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("[GET /api/admin/vetting]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
