/**
 * PATCH /api/onboarding/parent
 *
 * Updates the PetParent record with city/address during onboarding.
 * Called from the parent onboarding wizard (Step 1).
 *
 * Auth: required (PARENT only)
 * Input: { city, addressLine1, pincode }
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  city: z.string().min(1, "City is required").max(100),
  addressLine1: z.string().min(1, "Address is required").max(200),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional(),
})

export async function PATCH(request: NextRequest) {
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

    const { city, addressLine1, pincode } = body.data

    const parent = await prisma.petParent.update({
      where: { userId: authUser.id },
      data: { city, addressLine1, pincode },
    })

    return NextResponse.json({ parent })
  } catch (error) {
    console.error("[PATCH /api/onboarding/parent]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
