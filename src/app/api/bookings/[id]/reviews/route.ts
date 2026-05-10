/**
 * POST /api/bookings/[id]/reviews
 *
 * Submit a review after a completed booking.
 * - Parent → PARENT_TO_SITTER (public, shown on sitter profile)
 * - Sitter → SITTER_TO_PARENT (private, admin-only)
 *
 * When a parent review is submitted, the sitter's avgRating and
 * totalReviews are recomputed from all PARENT_TO_SITTER reviews.
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        parent: { select: { userId: true } },
        sitter: { select: { id: true, userId: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Reviews can only be submitted for completed bookings" },
        { status: 409 }
      )
    }

    const isParent = booking.parent.userId === user.id
    const isSitter = booking.sitter.userId === user.id

    if (!isParent && !isSitter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const direction = isParent ? "PARENT_TO_SITTER" : "SITTER_TO_PARENT"
    const revieweeId = isParent ? booking.sitter.userId : booking.parent.userId

    const review = await prisma.review.create({
      data: {
        bookingId: params.id,
        reviewerId: user.id,
        revieweeId,
        direction,
        rating: body.data.rating,
        comment: body.data.comment,
        // Public only for parent→sitter direction (shown on sitter profile)
        isPublic: direction === "PARENT_TO_SITTER",
      },
    })

    // Recompute sitter's aggregated rating when a parent leaves a review
    if (direction === "PARENT_TO_SITTER") {
      const stats = await prisma.review.aggregate({
        where: {
          revieweeId: booking.sitter.userId,
          direction: "PARENT_TO_SITTER",
        },
        _avg: { rating: true },
        _count: true,
      })

      await prisma.sitter.update({
        where: { id: booking.sitter.id },
        data: {
          avgRating: stats._avg.rating,
          totalReviews: stats._count,
        },
      })
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/bookings/[id]/reviews]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
