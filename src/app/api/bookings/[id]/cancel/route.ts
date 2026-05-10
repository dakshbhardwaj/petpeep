/**
 * PATCH /api/bookings/[id]/cancel — Parent or sitter cancels a booking.
 *
 * Calculates refund policy based on hours until visit:
 *   >24h  → FULL_REFUND (100%)
 *   6–24h → PARTIAL_REFUND (50%)
 *   <6h   → NO_REFUND (0%)
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { money } from "@/lib/money"

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
        parent: { select: { userId: true } },
        sitter: { select: { userId: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Only the booking's parent or sitter may cancel
    const isParent = booking.parent.userId === authUser.id
    const isSitter = booking.sitter.userId === authUser.id
    if (!isParent && !isSitter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Only PENDING or CONFIRMED bookings can be cancelled" },
        { status: 422 }
      )
    }

    // Parse booking date + startTime into a UTC timestamp
    // booking.date is stored as a Date (midnight UTC for the date); startTime is "HH:MM"
    const [hh, mm] = booking.startTime.split(":").map(Number)
    const visitDate = new Date(booking.date)
    visitDate.setUTCHours(hh, mm, 0, 0)

    const now = new Date()
    const hoursUntil = (visitDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    const refundPolicy = money.getCancellationPolicy(hoursUntil)
    const refundAmount = money.refund(booking.totalAmount, refundPolicy)

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelledBy: authUser.id,
        cancellationReason: body.data.reason,
        refundPolicy,
        refundAmount,
      },
    })

    return NextResponse.json({ booking: updated, refundPolicy, refundAmount })
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]/cancel]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
