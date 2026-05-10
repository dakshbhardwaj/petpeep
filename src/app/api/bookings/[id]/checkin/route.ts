/**
 * POST /api/bookings/[id]/checkin
 *
 * Sitter GPS check-in for an active booking.
 * Verifies the sitter is within ±200m of the parent's home address,
 * records a CHECK_IN BookingEvent, and transitions booking → IN_PROGRESS.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { haversineDistanceMeters } from "@/lib/geo"

const schema = z.object({
  latitude: z.number(),
  longitude: z.number(),
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

    const { latitude, longitude } = body.data

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: { include: { user: true } },
        parent: { select: { latitude: true, longitude: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.sitter.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Booking is not in CONFIRMED status" },
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

    const [event] = await prisma.$transaction([
      prisma.bookingEvent.create({
        data: {
          bookingId: params.id,
          type: "CHECK_IN",
          latitude,
          longitude,
          gpsVerified,
          timestamp: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: params.id },
        data: { status: "IN_PROGRESS" },
      }),
    ])

    return NextResponse.json({
      event,
      gpsVerified,
      distanceMeters: Math.round(distance),
    })
  } catch (error) {
    console.error("[POST /api/bookings/[id]/checkin]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
