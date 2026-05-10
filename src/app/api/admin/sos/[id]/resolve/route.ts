/**
 * PATCH /api/admin/sos/[id]/resolve
 *
 * Marks an SOS alert as resolved. Admin-only.
 * [id] is the SOSAlert.id
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  resolutionNotes: z.string().max(2000).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify caller is ADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { userType: true },
    })

    if (!adminUser || adminUser.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = schema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 })
    }

    // Fetch the alert
    const existing = await prisma.sOSAlert.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "SOS alert not found" }, { status: 404 })
    }

    if (existing.resolvedAt !== null) {
      return NextResponse.json({ error: "Already resolved" }, { status: 400 })
    }

    const alert = await prisma.sOSAlert.update({
      where: { id: params.id },
      data: {
        resolvedAt: new Date(),
        resolvedBy: authUser.id,
        resolutionNotes: body.data.resolutionNotes,
      },
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error("[PATCH /api/admin/sos/[id]/resolve]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
