/**
 * POST /api/onboarding/pet
 *
 * Creates a Pet record linked to the current user's PetParent profile.
 * Called from the parent onboarding wizard (Step 2).
 *
 * Auth: required (PARENT only)
 * Input: pet form fields (see schema below)
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Pet name is required").max(100),
  species: z.enum(["DOG", "CAT", "OTHER"]),
  breed: z.string().max(100).optional(),
  ageMonths: z.number().int().min(0).max(360).optional(),
  weightKg: z.number().min(0).max(200).optional(),
  profilePhotoUrl: z.string().url().optional(),

  // Behavioral profile
  hasEverBitten: z.boolean(),
  reactiveToStrangers: z.boolean(),
  resourceGuarding: z.boolean(),
  fearTriggers: z.string().max(500).optional(),
  behavioralNotes: z.string().max(1000).optional(),

  // Care notes
  dietaryNotes: z.string().max(500).optional(),
  medicalNotes: z.string().max(500).optional(),
  vetName: z.string().max(100).optional(),
  vetPhone: z.string().max(20).optional(),

  vaccinationStatus: z.boolean(),
  vaccinationDocUrl: z.string().url().optional(),
})

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
      return NextResponse.json(
        { error: "Invalid input", details: body.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Get the parent record
    const parent = await prisma.petParent.findUnique({
      where: { userId: authUser.id },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 })
    }

    const pet = await prisma.pet.create({
      data: {
        parentId: parent.id,
        name: body.data.name,
        species: body.data.species,
        breed: body.data.breed,
        age: body.data.ageMonths,
        weightKg: body.data.weightKg,
        profilePhotoUrl: body.data.profilePhotoUrl,
        hasEverBitten: body.data.hasEverBitten,
        reactiveToStrangers: body.data.reactiveToStrangers,
        resourceGuarding: body.data.resourceGuarding,
        fearTriggers: body.data.fearTriggers,
        behavioralNotes: body.data.behavioralNotes,
        dietaryNotes: body.data.dietaryNotes,
        medicalNotes: body.data.medicalNotes,
        vetName: body.data.vetName,
        vetPhone: body.data.vetPhone,
        vaccinationStatus: body.data.vaccinationStatus,
        vaccinationDocUrl: body.data.vaccinationDocUrl,
      },
    })

    return NextResponse.json({ pet }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/onboarding/pet]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
