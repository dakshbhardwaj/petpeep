/**
 * PATCH /api/bookings/[id]/accept — Sitter accepts a pending booking.
 *
 * Only the sitter assigned to the booking may call this.
 * Booking must be PENDING and within the 2-hour response window.
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _request: NextRequest,
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: { select: { userId: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Only the sitter for this booking can accept
    if (booking.sitter.userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only PENDING bookings can be accepted" },
        { status: 422 }
      )
    }

    // Check response deadline
    if (booking.sitterResponseDeadline && booking.sitterResponseDeadline < new Date()) {
      return NextResponse.json(
        { error: "Response deadline has passed. Booking has expired." },
        { status: 422 }
      )
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CONFIRMED" },
    })

    return NextResponse.json({ booking: updated })
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]/accept]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
