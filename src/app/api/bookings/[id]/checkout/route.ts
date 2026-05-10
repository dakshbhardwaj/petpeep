/**
 * POST /api/bookings/[id]/checkout
 *
 * Sitter GPS check-out with end-of-visit report.
 * Records a CHECK_OUT BookingEvent (with feeding/behaviour notes),
 * transitions booking → COMPLETED, and creates a Payout record for
 * the platform commission if one does not already exist.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { haversineDistanceMeters } from "@/lib/geo"

const schema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  feedingNotes: z.enum(["ate_well", "ate_less", "did_not_eat", "na"]),
  behaviourNotes: z.string().max(1000).optional(),
  anyConcerns: z.string().max(1000).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = schema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
    }

    const { latitude, longitude, feedingNotes, behaviourNotes, anyConcerns } =
      body.data

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: { include: { user: true } },
        parent: { select: { latitude: true, longitude: true } },
        payout: { select: { id: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.sitter.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (booking.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Booking is not IN_PROGRESS" },
        { status: 409 }
      )
    }

    // Compute GPS verification
    let gpsVerified = false
    let distance = 0

    if (booking.parent.latitude !== null && booking.parent.longitude !== null) {
      distance = haversineDistanceMeters(
        latitude,
        longitude,
        booking.parent.latitude,
        booking.parent.longitude
      )
      gpsVerified = distance <= 200
    }

    const reportNotes = JSON.stringify({ feedingNotes, behaviourNotes, anyConcerns })

    const { event, updatedBooking } = await prisma.$transaction(async (tx) => {
      const event = await tx.bookingEvent.create({
        data: {
          bookingId: params.id,
          type: "CHECK_OUT",
          latitude,
          longitude,
          gpsVerified,
          timestamp: new Date(),
          reportNotes,
        },
      })

      const updatedBooking = await tx.booking.update({
        where: { id: params.id },
        data: { status: "COMPLETED" },
      })

      if (!booking.payout) {
        await tx.payout.create({
          data: {
            bookingId: params.id,
            sitterId: booking.sitterId,
            amount: booking.platformFee,
            status: "PENDING",
          },
        })
      }

      return { event, updatedBooking }
    })

    return NextResponse.json({
      event,
      booking: { status: updatedBooking.status },
      gpsVerified,
      distanceMeters: Math.round(distance),
    })
  } catch (error) {
    console.error("[POST /api/bookings/[id]/checkout]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
