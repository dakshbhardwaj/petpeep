/**
 * POST /api/bookings — Create a new booking request.
 *
 * Parent sends a booking to an approved sitter. Sitter has 2 hours to respond.
 * All amounts stored in paise.
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { money } from "@/lib/money"

const schema = z.object({
  sitterId: z.string().min(1),
  serviceType: z.enum(["DROP_IN_1HR", "DROP_IN_2HR", "DROP_IN_4HR"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  petIds: z.array(z.string().min(1)).min(1, "At least one pet required"),
  notesToSitter: z.string().max(1000).optional(),
})

/** Compute endTime string ("HH:MM") by adding hours to a "HH:MM" string. */
function addHours(time: string, hours: number): string {
  const [hh, mm] = time.split(":").map(Number)
  const totalMinutes = hh * 60 + mm + hours * 60
  const endHH = Math.floor(totalMinutes / 60) % 24
  const endMM = totalMinutes % 60
  return `${String(endHH).padStart(2, "0")}:${String(endMM).padStart(2, "0")}`
}

const SERVICE_DURATION: Record<string, number> = {
  DROP_IN_1HR: 1,
  DROP_IN_2HR: 2,
  DROP_IN_4HR: 4,
}

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
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
    }

    const { sitterId, serviceType, date, startTime, petIds, notesToSitter } = body.data

    // Verify caller is a parent
    const parent = await prisma.petParent.findUnique({
      where: { userId: authUser.id },
    })
    if (!parent) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 401 })
    }

    // Verify sitter exists and is approved
    const sitter = await prisma.sitter.findUnique({
      where: { id: sitterId },
      select: {
        id: true,
        vettingStatus: true,
        hourlyRate1Hr: true,
        hourlyRate2Hr: true,
        hourlyRate4Hr: true,
      },
    })
    if (!sitter) {
      return NextResponse.json({ error: "Sitter not found" }, { status: 404 })
    }
    if (sitter.vettingStatus !== "APPROVED") {
      return NextResponse.json({ error: "Sitter is not available for bookings" }, { status: 422 })
    }

    // Verify all pets belong to this parent
    const pets = await prisma.pet.findMany({
      where: {
        id: { in: petIds },
        parentId: parent.id,
        isActive: true,
      },
      select: { id: true },
    })
    if (pets.length !== petIds.length) {
      return NextResponse.json(
        { error: "One or more pets not found or do not belong to this parent" },
        { status: 422 }
      )
    }

    // Compute endTime
    const duration = SERVICE_DURATION[serviceType]
    const endTime = addHours(startTime, duration)

    // Check for overlapping booking for this sitter on the same date/time
    const bookingDate = new Date(date)
    const overlap = await prisma.booking.findFirst({
      where: {
        sitterId,
        date: bookingDate,
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
        // Overlap: new startTime < existing endTime AND new endTime > existing startTime
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    })
    if (overlap) {
      return NextResponse.json(
        { error: "Sitter already has a booking at this time" },
        { status: 409 }
      )
    }

    // Determine rate based on service type
    const rateMap: Record<string, number | null> = {
      DROP_IN_1HR: sitter.hourlyRate1Hr,
      DROP_IN_2HR: sitter.hourlyRate2Hr,
      DROP_IN_4HR: sitter.hourlyRate4Hr,
    }
    const rate = rateMap[serviceType]
    if (!rate) {
      return NextResponse.json(
        { error: "Sitter does not offer this service type" },
        { status: 422 }
      )
    }

    // Compute financials
    const totalAmount = rate
    const platformFee = money.commission(totalAmount)
    const sitterEarningsAmount = money.sitterEarnings(totalAmount)
    const sitterResponseDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000)

    // Create booking + junction records in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          parentId: parent.id,
          sitterId,
          serviceType,
          date: bookingDate,
          startTime,
          endTime,
          notesToSitter,
          status: "PENDING",
          totalAmount,
          platformFee,
          sitterEarnings: sitterEarningsAmount,
          paymentMethod: "UPI_DIRECT",
          sitterResponseDeadline,
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          sitterResponseDeadline: true,
        },
      })

      await tx.bookingPet.createMany({
        data: petIds.map((petId) => ({ bookingId: created.id, petId })),
      })

      return created
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/bookings]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
