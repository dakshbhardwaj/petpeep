/**
 * /pets/[id] — Pet detail view.
 */
export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import type { Metadata } from "next"

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pet = await prisma.pet.findUnique({ where: { id: params.id }, select: { name: true } })
  return { title: pet ? `${pet.name}'s Profile` : "Pet Not Found" }
}

const SPECIES_EMOJI: Record<string, string> = { DOG: "🐕", CAT: "🐈", OTHER: "🐾" }

export default async function PetDetailPage({ params }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const parent = await prisma.petParent.findUnique({ where: { userId: authUser.id } })
  if (!parent) redirect("/sign-up")

  const pet = await prisma.pet.findUnique({
    where: { id: params.id, parentId: parent.id, isActive: true },
  })

  if (!pet) notFound()

  const ageDisplay = pet.age
    ? `${Math.floor(pet.age / 12) > 0 ? `${Math.floor(pet.age / 12)} yr ` : ""}${pet.age % 12 > 0 ? `${pet.age % 12} mo` : ""}`.trim()
    : null

  return (
    <div className="container max-w-lg py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/pets"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          My pets
        </Link>
        <Link
          href={`/pets/${pet.id}/edit`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Edit
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-5xl">
          {SPECIES_EMOJI[pet.species] ?? "🐾"}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{pet.name}</h1>
          <p className="text-muted-foreground">
            {pet.breed ?? pet.species.charAt(0) + pet.species.slice(1).toLowerCase()}
            {ageDisplay && ` · ${ageDisplay}`}
            {pet.weightKg && ` · ${pet.weightKg} kg`}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {pet.vaccinationStatus && <Badge variant="success">Vaccinated</Badge>}
            {pet.hasEverBitten && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" /> Biting history
              </Badge>
            )}
            {pet.reactiveToStrangers && <Badge variant="warning">Reactive</Badge>}
            {pet.resourceGuarding && <Badge variant="warning">Resource guards</Badge>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Behavioral profile */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Behaviour
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ever bitten anyone</span>
                <span className={pet.hasEverBitten ? "font-medium text-destructive" : ""}>
                  {pet.hasEverBitten ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reactive to strangers</span>
                <span className={pet.reactiveToStrangers ? "font-medium text-warning" : ""}>
                  {pet.reactiveToStrangers ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resource guards</span>
                <span className={pet.resourceGuarding ? "font-medium text-warning" : ""}>
                  {pet.resourceGuarding ? "Yes" : "No"}
                </span>
              </div>
              {pet.fearTriggers && (
                <div>
                  <p className="text-muted-foreground">Fear triggers</p>
                  <p className="mt-0.5">{pet.fearTriggers}</p>
                </div>
              )}
              {pet.behavioralNotes && (
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p className="mt-0.5">{pet.behavioralNotes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Care notes */}
        {(pet.dietaryNotes || pet.medicalNotes || pet.vetName) && (
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Care Notes
              </h2>
              <div className="space-y-3 text-sm">
                {pet.dietaryNotes && (
                  <div>
                    <p className="font-medium">Diet</p>
                    <p className="text-muted-foreground">{pet.dietaryNotes}</p>
                  </div>
                )}
                {pet.medicalNotes && (
                  <div>
                    <p className="font-medium">Medical</p>
                    <p className="text-muted-foreground">{pet.medicalNotes}</p>
                  </div>
                )}
                {(pet.vetName || pet.vetPhone) && (
                  <div>
                    <p className="font-medium">Vet</p>
                    <p className="text-muted-foreground">
                      {pet.vetName}
                      {pet.vetPhone && ` · ${pet.vetPhone}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
