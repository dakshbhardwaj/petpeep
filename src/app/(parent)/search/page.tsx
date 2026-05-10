/**
 * /search — Find a sitter.
 * Shows all APPROVED sitters with city filter.
 * Booking is coming in Phase 3 — for now shows profile links.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { money } from "@/lib/money"
import { MapPin, Star, Dog, Cat, PawPrint } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Find a Sitter" }

interface PageProps {
  searchParams: { city?: string }
}

const CITIES = ["All cities", "Mumbai", "Pune", "Navi Mumbai", "Thane"]

export default async function SearchPage({ searchParams }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const selectedCity = searchParams.city ?? ""

  const sitters = await prisma.sitter.findMany({
    where: {
      vettingStatus: "APPROVED",
      ...(selectedCity ? { city: selectedCity } : {}),
    },
    orderBy: [{ avgRating: "desc" }, { totalReviews: "desc" }],
    include: {
      user: { select: { name: true, profilePhoto: true } },
    },
  })

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Find a sitter</h1>
        <p className="text-sm text-muted-foreground">All sitters are verified by PetPeep</p>
      </div>

      {/* City filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CITIES.map((city) => {
          const val = city === "All cities" ? "" : city
          const isActive = selectedCity === val
          return (
            <Link
              key={city}
              href={val ? `/search?city=${val}` : "/search"}
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

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {sitters.length} sitter{sitters.length !== 1 ? "s" : ""} available
        {selectedCity ? ` in ${selectedCity}` : ""}
      </p>

      {/* Empty state */}
      {sitters.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sitters available in this area yet.</p>
            <Link href="/search" className="mt-2 block text-sm text-primary hover:underline">
              Show all cities
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Sitter cards */}
      <div className="space-y-3">
        {sitters.map((sitter) => {
          const rates = [sitter.hourlyRate1Hr, sitter.hourlyRate2Hr, sitter.hourlyRate4Hr].filter(
            (r): r is number => r !== null && r > 0
          )
          const lowestRate = rates.length > 0 ? Math.min(...rates) : null

          const acceptedPets = [
            sitter.acceptsDogs && "Dogs",
            sitter.acceptsCats && "Cats",
            sitter.acceptsOthers && "Others",
          ].filter(Boolean) as string[]

          return (
            <Link key={sitter.id} href={`/sitters/${sitter.id}`}>
              <Card className="cursor-pointer hover:shadow-card-hover transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarImage
                        src={sitter.user.profilePhoto ?? undefined}
                        alt={sitter.user.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {sitter.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{sitter.user.name}</p>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {sitter.city}
                            {sitter.serviceRadiusKm > 0 && ` · ${sitter.serviceRadiusKm} km`}
                          </div>
                        </div>
                        {lowestRate !== null && (
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">from</p>
                            <p className="font-bold text-primary">{money.format(lowestRate)}</p>
                          </div>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="mt-1.5 flex items-center gap-2">
                        {sitter.avgRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                            <span className="text-xs font-medium">
                              {sitter.avgRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({sitter.totalReviews})
                            </span>
                          </div>
                        ) : (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            New
                          </Badge>
                        )}
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          Verified
                        </Badge>
                      </div>

                      {/* Pets accepted */}
                      {acceptedPets.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {sitter.acceptsDogs && <Dog className="h-3.5 w-3.5 text-muted-foreground" />}
                          {sitter.acceptsCats && <Cat className="h-3.5 w-3.5 text-muted-foreground" />}
                          {sitter.acceptsOthers && <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="text-xs text-muted-foreground">
                            {acceptedPets.join(", ")}
                          </span>
                        </div>
                      )}

                      {sitter.bio && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                          {sitter.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
