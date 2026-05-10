/**
 * PATCH /api/bookings/[id]/confirm-payment — Sitter confirms UPI payment received.
 *
 * Only callable by the sitter on a CONFIRMED booking.
 * Creates a Payout record for the platform commission (15%) owed by sitter.
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  paymentNotes: z.string().max(500).optional(),
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

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Payment can only be confirmed on CONFIRMED bookings" },
        { status: 422 }
      )
    }

    if (booking.paymentConfirmed) {
      return NextResponse.json(
        { error: "Payment has already been confirmed" },
        { status: 409 }
      )
    }

    const now = new Date()

    // Update booking and create payout record in a transaction
    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: {
          paymentConfirmed: true,
          paymentConfirmedAt: now,
          paymentNotes: body.data.paymentNotes,
        },
      }),
      prisma.payout.create({
        data: {
          bookingId: booking.id,
          sitterId: booking.sitterId,
          amount: booking.platformFee,
          status: "PENDING",
          payoutMethod: "UPI",
        },
      }),
    ])

    return NextResponse.json({ booking: updated })
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]/confirm-payment]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
