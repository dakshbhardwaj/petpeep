/**
 * /pets — Parent's pet list.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Pets" }

const SPECIES_EMOJI: Record<string, string> = { DOG: "🐕", CAT: "🐈", OTHER: "🐾" }

export default async function PetsPage() {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const parent = await prisma.petParent.findUnique({
    where: { userId: authUser.id },
    include: {
      pets: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  })

  if (!parent) redirect("/sign-up")

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">My pets</h1>
          <p className="text-sm text-muted-foreground">{parent.pets.length} pet{parent.pets.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/pets/add"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add pet
        </Link>
      </div>

      {parent.pets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-3 text-4xl">🐾</div>
            <p className="font-medium">No pets yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your pet to start booking sitters
            </p>
            <Link
              href="/pets/add"
              className="mt-4 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
            >
              Add your first pet
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {parent.pets.map((pet) => (
            <Link key={pet.id} href={`/pets/${pet.id}`}>
              <Card className="cursor-pointer hover:shadow-card-hover transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-3xl">
                      {SPECIES_EMOJI[pet.species] ?? "🐾"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{pet.name}</p>
                        {pet.hasEverBitten && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                            Biting history
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pet.breed ?? pet.species.charAt(0) + pet.species.slice(1).toLowerCase()}
                        {pet.age ? ` · ${Math.floor(pet.age / 12) > 0 ? `${Math.floor(pet.age / 12)}y ` : ""}${pet.age % 12 > 0 ? `${pet.age % 12}m` : ""}` : ""}
                        {pet.weightKg ? ` · ${pet.weightKg} kg` : ""}
                      </p>
                      <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                        {pet.vaccinationStatus && (
                          <span className="text-success">✓ Vaccinated</span>
                        )}
                        {pet.reactiveToStrangers && <span className="text-warning">⚠ Reactive</span>}
                        {pet.resourceGuarding && <span className="text-warning">⚠ Resource guards</span>}
                      </div>
                    </div>

                    <span className="text-muted-foreground text-sm">›</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
