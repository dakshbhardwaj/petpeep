/**
 * GET  /api/bookings/[id]/messages — fetch all messages and mark unread ones as read
 * POST /api/bookings/[id]/messages — send a new message
 *
 * Both parent and sitter of the booking may read and send messages.
 * Sending is blocked if the booking is CANCELLED.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

const postSchema = z.object({
  content: z.string().min(1).max(500),
})

async function getBookingParties(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    select: {
      status: true,
      parent: { select: { userId: true } },
      sitter: { select: { userId: true } },
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

    const booking = await getBookingParties(params.id)

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const isParent = booking.parent.userId === user.id
    const isSitter = booking.sitter.userId === user.id

    if (!isParent && !isSitter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch messages and mark unread messages from the other party as read
    const [messages] = await Promise.all([
      prisma.message.findMany({
        where: { bookingId: params.id },
        orderBy: { sentAt: "asc" },
      }),
      prisma.message.updateMany({
        where: {
          bookingId: params.id,
          readAt: null,
          senderId: { not: user.id },
        },
        data: { readAt: new Date() },
      }),
    ])

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[GET /api/bookings/[id]/messages]", error)
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

    const booking = await getBookingParties(params.id)

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const isParent = booking.parent.userId === user.id
    const isSitter = booking.sitter.userId === user.id

    if (!isParent && !isSitter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot send messages on a cancelled booking" },
        { status: 409 }
      )
    }

    const message = await prisma.message.create({
      data: {
        bookingId: params.id,
        senderId: user.id,
        content: body.data.content,
        sentAt: new Date(),
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/bookings/[id]/messages]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
