import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { haversineDistanceMeters } from "@/lib/geo"
import type { SitterSearchResult } from "@/types"

const querySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().int().min(1).max(100).default(10),
  petType: z.enum(["dog", "cat", "other", ""]).default(""),
  minPrice: z.coerce.number().int().min(0).default(0),
  maxPrice: z.coerce.number().int().min(0).default(9999),
  minRating: z.coerce.number().min(0).max(5).default(0),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = request.nextUrl
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { radius, petType, minPrice, maxPrice, minRating } = parsed.data
    let { lat, lng } = parsed.data

    if (lat === undefined || lng === undefined) {
      const parent = await prisma.petParent.findUnique({
        where: { userId: authUser.id },
        select: { latitude: true, longitude: true },
      })
      if (parent?.latitude != null && parent?.longitude != null) {
        lat = parent.latitude
        lng = parent.longitude
      }
    }

    const allSitters = await prisma.sitter.findMany({
      where: { vettingStatus: "APPROVED" },
      include: {
        user: { select: { id: true, name: true, profilePhoto: true } },
      },
    })

    const minPricePaise = minPrice * 100
    const maxPricePaise = maxPrice * 100

    const filtered: (SitterSearchResult & { distanceKm: number })[] = []

    for (const sitter of allSitters) {
      if (sitter.latitude == null || sitter.longitude == null) continue

      if (lat !== undefined && lng !== undefined) {
        const distanceMeters = haversineDistanceMeters(lat, lng, sitter.latitude, sitter.longitude)
        if (distanceMeters > radius * 1000) continue
        const distanceKm = distanceMeters / 1000

        if (petType === "dog" && !sitter.acceptsDogs) continue
        if (petType === "cat" && !sitter.acceptsCats) continue
        if (petType === "other" && !sitter.acceptsOthers) continue

        if (minPrice > 0) {
          const rates = [sitter.hourlyRate1Hr, sitter.hourlyRate2Hr, sitter.hourlyRate4Hr].filter(
            (r): r is number => r != null
          )
          if (!rates.some((r) => r >= minPricePaise)) continue
        }

        if (maxPrice < 9999) {
          const rates = [sitter.hourlyRate1Hr, sitter.hourlyRate2Hr, sitter.hourlyRate4Hr].filter(
            (r): r is number => r != null
          )
          if (!rates.some((r) => r <= maxPricePaise)) continue
        }

        if (minRating > 0 && (sitter.avgRating == null || sitter.avgRating < minRating)) continue

        filtered.push({
          ...sitter,
          distanceKm: Math.round(distanceKm * 10) / 10,
        })
      } else {
        if (petType === "dog" && !sitter.acceptsDogs) continue
        if (petType === "cat" && !sitter.acceptsCats) continue
        if (petType === "other" && !sitter.acceptsOthers) continue

        if (minPrice > 0) {
          const rates = [sitter.hourlyRate1Hr, sitter.hourlyRate2Hr, sitter.hourlyRate4Hr].filter(
            (r): r is number => r != null
          )
          if (!rates.some((r) => r >= minPricePaise)) continue
        }

        if (maxPrice < 9999) {
          const rates = [sitter.hourlyRate1Hr, sitter.hourlyRate2Hr, sitter.hourlyRate4Hr].filter(
            (r): r is number => r != null
          )
          if (!rates.some((r) => r <= maxPricePaise)) continue
        }

        if (minRating > 0 && (sitter.avgRating == null || sitter.avgRating < minRating)) continue

        filtered.push({ ...sitter, distanceKm: 0 })
      }
    }

    filtered.sort((a, b) => a.distanceKm - b.distanceKm)

    const sitters = filtered.map((s) => ({
      id: s.id,
      city: s.city,
      bio: s.bio,
      acceptsDogs: s.acceptsDogs,
      acceptsCats: s.acceptsCats,
      acceptsOthers: s.acceptsOthers,
      avgRating: s.avgRating,
      totalReviews: s.totalReviews,
      hourlyRate1Hr: s.hourlyRate1Hr,
      hourlyRate2Hr: s.hourlyRate2Hr,
      hourlyRate4Hr: s.hourlyRate4Hr,
      serviceRadiusKm: s.serviceRadiusKm,
      latitude: s.latitude,
      longitude: s.longitude,
      distanceKm: s.distanceKm,
      user: s.user,
    }))

    return NextResponse.json({ sitters, total: sitters.length })
  } catch (error) {
    console.error("[GET /api/sitters/search]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
