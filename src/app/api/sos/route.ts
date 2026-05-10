/**
 * POST /api/sos
 *
 * Triggers an SOS alert for an in-progress booking.
 * Only the parent or sitter of the booking may trigger SOS.
 * Booking must be IN_PROGRESS (SOS is only valid during active visits).
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  bookingId: z.string().min(1),
  description: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 })
    }

    const { bookingId, description } = body.data

    // Fetch booking with parent and sitter user IDs to verify caller
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        parent: { select: { userId: true } },
        sitter: { select: { userId: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Caller must be the parent or sitter of this booking
    const isParent = booking.parent.userId === authUser.id
    const isSitter = booking.sitter.userId === authUser.id
    if (!isParent && !isSitter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // SOS is only valid during an active visit
    if (booking.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "SOS can only be triggered for bookings that are in progress" },
        { status: 400 }
      )
    }

    const alert = await prisma.sOSAlert.create({
      data: {
        bookingId,
        triggeredById: authUser.id,
        description,
        triggeredAt: new Date(),
      },
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/sos]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
