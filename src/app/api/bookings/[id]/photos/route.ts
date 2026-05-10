/**
 * GET  /api/bookings/[id]/photos — list all photo updates for a booking
 * POST /api/bookings/[id]/photos — record a photo URL after client-side Supabase Storage upload
 *
 * Both parent and sitter of the booking may GET.
 * Only the sitter may POST (booking must be IN_PROGRESS).
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

const postSchema = z.object({
  photoUrl: z.string().url(),
  caption: z.string().max(300).optional(),
})

async function getBookingWithParties(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      parent: { select: { userId: true } },
      sitter: { select: { id: true, userId: true } },
    },
  })
}

export async function GET(
  _request: NextRequest,
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

    const booking = await getBookingWithParties(params.id)

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const isParent = booking.parent.userId === user.id
    const isSitter = booking.sitter.userId === user.id

    if (!isParent && !isSitter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const photos = await prisma.photoUpdate.findMany({
      where: { bookingId: params.id },
      orderBy: { sentAt: "asc" },
    })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("[GET /api/bookings/[id]/photos]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const body = postSchema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
    }

    const booking = await getBookingWithParties(params.id)

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.sitter.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (booking.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Photos can only be uploaded during an active visit" },
        { status: 409 }
      )
    }

    const photo = await prisma.photoUpdate.create({
      data: {
        bookingId: params.id,
        sitterId: booking.sitter.id,
        photoUrl: body.data.photoUrl,
        caption: body.data.caption,
        sentAt: new Date(),
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/bookings/[id]/photos]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
