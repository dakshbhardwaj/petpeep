/**
 * POST /api/auth/create-user
 *
 * Creates the User record in our database after a successful Supabase Auth sign-up.
 * Called from the sign-up page after OTP verification + profile step.
 *
 * Auth: required (Supabase session must exist)
 * Input: { name, userType }
 * Output: { user: User }
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  userType: z.enum(["PARENT", "SITTER"], {
    errorMap: () => ({ message: 'userType must be "PARENT" or "SITTER"' }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = createServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Validate input
    const body = schema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid input", details: body.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, userType } = body.data

    // 3. Check if user already exists (idempotency)
    const existing = await prisma.user.findUnique({
      where: { email: authUser.email! },
    })

    if (existing) {
      return NextResponse.json({ user: existing }, { status: 200 })
    }

    // 4. Create User + related profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: authUser.id, // Use Supabase Auth UUID as our User ID
          email: authUser.email!,
          name: name.trim(),
          userType,
        },
      })

      // Create the associated profile record
      if (userType === "PARENT") {
        await tx.petParent.create({
          data: {
            userId: newUser.id,
            city: "Mumbai", // Default — updated during onboarding
          },
        })
      } else if (userType === "SITTER") {
        await tx.sitter.create({
          data: {
            userId: newUser.id,
            city: "Mumbai", // Default — updated during application
          },
        })
      }

      return newUser
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/auth/create-user]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
