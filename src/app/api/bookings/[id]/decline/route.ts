/**
 * PATCH /api/bookings/[id]/decline — Sitter declines a pending booking.
 *
 * Only the sitter assigned to the booking may call this.
 * Booking must be PENDING.
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  reason: z.string().max(500).optional(),
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

    const body = schema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: { select: { userId: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.sitter.userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only PENDING bookings can be declined" },
        { status: 422 }
      )
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: authUser.id,
        cancellationReason: body.data.reason ?? "Declined by sitter",
      },
    })

    return NextResponse.json({ booking: updated })
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]/decline]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
