/**
 * POST /api/admin/vetting/[id]/approve
 *
 * Approves a sitter application. Updates Sitter status and sends approval email.
 * [id] is the SitterApplication.id
 *
 * Admin only.
 * Input: { notes? }
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendApplicationApproved } from "@/lib/email"

const schema = z.object({
  notes: z.string().max(1000).optional(),
})

export async function POST(
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

    const admin = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { userType: true },
    })

    if (admin?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = schema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    // Fetch the application
    const application = await prisma.sitterApplication.findUnique({
      where: { id: params.id },
      include: {
        sitter: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Update both SitterApplication and Sitter in a transaction
    await prisma.$transaction([
      prisma.sitterApplication.update({
        where: { id: params.id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: authUser.id,
          reviewNotes: body.data.notes,
        },
      }),
      prisma.sitter.update({
        where: { id: application.sitterId },
        data: {
          vettingStatus: "APPROVED",
          approvedAt: new Date(),
          adminReviewedBy: authUser.id,
          adminReviewNotes: body.data.notes,
        },
      }),
    ])

    // Send approval email
    sendApplicationApproved({
      to: application.sitter.user.email,
      name: application.sitter.user.name,
    }).catch((err) => console.error("[email send error]", err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/admin/vetting/[id]/approve]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
