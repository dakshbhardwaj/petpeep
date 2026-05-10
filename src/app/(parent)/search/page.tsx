export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { haversineDistanceMeters } from "@/lib/geo"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { SitterCard } from "@/components/sitters/SitterCard"
import { SlidersHorizontal } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Find a Sitter" }

interface PageProps {
  searchParams: {
    city?: string
    petType?: string
    minPrice?: string
    maxPrice?: string
    radius?: string
  }
}

const CITIES = ["All cities", "Mumbai", "Pune", "Navi Mumbai", "Thane"]

function buildHref(
  base: Record<string, string>,
  overrides: Record<string, string>
): string {
  const params = new URLSearchParams({ ...base, ...overrides })
  for (const [k, v] of Array.from(params.entries())) {
    if (!v) params.delete(k)
  }
  const qs = params.toString()
  return qs ? `/search?${qs}` : "/search"
}

export default async function SearchPage({ searchParams }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const selectedCity = searchParams.city ?? ""
  const petType = searchParams.petType ?? ""
  const minPrice = parseInt(searchParams.minPrice ?? "0", 10) || 0
  const maxPrice = parseInt(searchParams.maxPrice ?? "9999", 10) || 9999
  const radius = parseInt(searchParams.radius ?? "10", 10) || 10

  const parent = await prisma.petParent.findUnique({
    where: { userId: authUser.id },
    select: { city: true, latitude: true, longitude: true },
  })

  const allSitters = await prisma.sitter.findMany({
    where: {
      vettingStatus: "APPROVED",
      ...(selectedCity ? { city: selectedCity } : {}),
    },
    orderBy: [{ avgRating: "desc" }, { totalReviews: "desc" }],
    include: {
      user: { select: { name: true, profilePhoto: true } },
    },
  })

  const parentLat = parent?.latitude ?? null
  const parentLng = parent?.longitude ?? null
  const minPricePaise = minPrice * 100
  const maxPricePaise = maxPrice * 100

  const sitters = allSitters
    .filter((sitter) => {
      if (petType === "dog" && !sitter.acceptsDogs) return false
      if (petType === "cat" && !sitter.acceptsCats) return false
      if (petType === "other" && !sitter.acceptsOthers) return false

      if (minPrice > 0) {
        const rates = [sitter.hourlyRate1Hr, sitter.hourlyRate2Hr, sitter.hourlyRate4Hr].filter(
          (r): r is number => r != null
        )
        if (!rates.some((r) => r >= minPricePaise)) return false
      }

      if (maxPrice < 9999) {
        const rates = [sitter.hourlyRate1Hr, sitter.hourlyRate2Hr, sitter.hourlyRate4Hr].filter(
          (r): r is number => r != null
        )
        if (!rates.some((r) => r <= maxPricePaise)) return false
      }

      if (
        parentLat != null &&
        parentLng != null &&
        sitter.latitude != null &&
        sitter.longitude != null
      ) {
        const distanceMeters = haversineDistanceMeters(
          parentLat,
          parentLng,
          sitter.latitude,
          sitter.longitude
        )
        if (distanceMeters > radius * 1000) return false
      }

      return true
    })
    .map((sitter) => {
      let distanceKm: number | null = null
      if (
        parentLat != null &&
        parentLng != null &&
        sitter.latitude != null &&
        sitter.longitude != null
      ) {
        const distanceMeters = haversineDistanceMeters(
          parentLat,
          parentLng,
          sitter.latitude,
          sitter.longitude
        )
        distanceKm = Math.round((distanceMeters / 1000) * 10) / 10
      }
      return { ...sitter, distanceKm }
    })
    .sort((a, b) => {
      if (parentLat != null && parentLng != null) {
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
      }
      return 0
    })

  const currentParams: Record<string, string> = {}
  if (selectedCity) currentParams.city = selectedCity
  if (petType) currentParams.petType = petType
  if (minPrice > 0) currentParams.minPrice = String(minPrice)
  if (maxPrice < 9999) currentParams.maxPrice = String(maxPrice)

  const hasActiveFilters = petType !== "" || minPrice > 0 || maxPrice < 9999

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Find a sitter</h1>
        <p className="text-sm text-muted-foreground">All sitters are verified by PetPeep</p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CITIES.map((city) => {
          const val = city === "All cities" ? "" : city
          const isActive = selectedCity === val
          return (
            <Link
              key={city}
              href={buildHref(currentParams, { city: val })}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {city}
            </Link>
          )
        })}
      </div>

      <form method="GET" action="/search" className="mb-5">
        {selectedCity && <input type="hidden" name="city" value={selectedCity} />}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            name="petType"
            defaultValue={petType}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All pets</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="other">Others</option>
          </select>
          <select
            name="maxPrice"
            defaultValue={maxPrice < 9999 ? String(maxPrice) : ""}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Any price</option>
            <option value="300">Under ₹300/hr</option>
            <option value="500">Under ₹500/hr</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
          {hasActiveFilters && (
            <Link
              href={selectedCity ? `/search?city=${selectedCity}` : "/search"}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Clear filters
            </Link>
          )}
        </div>
      </form>

      <p className="mb-4 text-sm text-muted-foreground">
        {sitters.length} sitter{sitters.length !== 1 ? "s" : ""} available
        {selectedCity ? ` in ${selectedCity}` : ""}
      </p>

      {sitters.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sitters available matching your filters.</p>
            <Link href="/search" className="mt-2 block text-sm text-primary hover:underline">
              Clear all filters
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sitters.map((sitter) => (
          <SitterCard key={sitter.id} sitter={sitter} />
        ))}
      </div>
    </div>
  )
}
