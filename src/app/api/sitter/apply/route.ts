/**
 * POST /api/sitter/apply
 *
 * Submits the sitter application. Creates a SitterApplication record and
 * updates the Sitter profile with the supplied details. Sends confirmation emails.
 *
 * Auth: required (SITTER only)
 * Prereq: quiz must be passed (quizPassed === true on Sitter record)
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendApplicationReceived, sendNewApplicationToAdmin } from "@/lib/email"

const schema = z.object({
  // Step 1 — Your story
  bio: z.string().min(50, "Bio must be at least 50 characters").max(1000),
  experience: z.string().min(30, "Please describe your experience").max(2000),
  motivation: z.string().max(1000).optional(),
  homeEnvironment: z.string().max(1000).optional(),

  // Step 2 — Services
  city: z.string().min(1).max(100),
  acceptsDogs: z.boolean(),
  acceptsCats: z.boolean(),
  acceptsOthers: z.boolean(),
  serviceRadiusKm: z.number().int().min(1).max(50),
  rate1Hr: z.number().int().min(0).optional(), // in paise
  rate2Hr: z.number().int().min(0).optional(),
  rate4Hr: z.number().int().min(0).optional(),

  // Step 3 — ID documents (Supabase Storage URLs, uploaded client-side)
  aadhaarDocUrl: z.string().url().optional(),
  selfieUrl: z.string().url().optional(),

  // Contact
  phone: z.string().min(10).max(15),
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

    // Get sitter + user details
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { sitter: { include: { application: true } } },
    })

    if (!user?.sitter) {
      return NextResponse.json({ error: "Sitter profile not found" }, { status: 404 })
    }

    const { sitter } = user

    // Must have passed the quiz first
    if (!sitter.quizPassed) {
      return NextResponse.json(
        { error: "You must pass the pet care quiz before submitting your application." },
        { status: 422 }
      )
    }

    // If already submitted and PENDING/APPROVED, block re-submit
    if (
      sitter.application &&
      (sitter.vettingStatus === "PENDING" || sitter.vettingStatus === "APPROVED")
    ) {
      return NextResponse.json(
        { error: "You have already submitted an application." },
        { status: 409 }
      )
    }

    const body = schema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid input", details: body.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = body.data

    // Create / update in a transaction
    const application = await prisma.$transaction(async (tx) => {
      // Update Sitter profile
      await tx.sitter.update({
        where: { id: sitter.id },
        data: {
          bio: data.bio,
          experience: data.experience,
          homeEnvironment: data.homeEnvironment,
          city: data.city,
          acceptsDogs: data.acceptsDogs,
          acceptsCats: data.acceptsCats,
          acceptsOthers: data.acceptsOthers,
          serviceRadiusKm: data.serviceRadiusKm,
          hourlyRate1Hr: data.rate1Hr,
          hourlyRate2Hr: data.rate2Hr,
          hourlyRate4Hr: data.rate4Hr,
          aadhaarDocUrl: data.aadhaarDocUrl,
          selfieUrl: data.selfieUrl,
          vettingStatus: "PENDING",
        },
      })

      // Update User phone if provided
      if (data.phone) {
        await tx.user.update({
          where: { id: authUser.id },
          data: { phone: data.phone },
        })
      }

      // Upsert SitterApplication
      const app = await tx.sitterApplication.upsert({
        where: { sitterId: sitter.id },
        create: {
          sitterId: sitter.id,
          fullName: user.name,
          phone: data.phone,
          city: data.city,
          petExperience: data.experience,
          motivation: data.motivation,
          aadhaarDocUrl: data.aadhaarDocUrl,
          selfieUrl: data.selfieUrl,
          quizScore: sitter.quizScore,
          quizPassedAt: sitter.quizLastAttempt,
          status: "PENDING",
        },
        update: {
          phone: data.phone,
          city: data.city,
          petExperience: data.experience,
          motivation: data.motivation,
          aadhaarDocUrl: data.aadhaarDocUrl,
          selfieUrl: data.selfieUrl,
          quizScore: sitter.quizScore,
          quizPassedAt: sitter.quizLastAttempt,
          status: "PENDING",
          updatedAt: new Date(),
        },
      })

      return app
    })

    // Send emails — fire and forget (don't block the response)
    Promise.all([
      sendApplicationReceived({ to: user.email, name: user.name }),
      sendNewApplicationToAdmin({
        sitterName: user.name,
        sitterEmail: user.email,
        applicationId: application.id,
      }),
    ]).catch((err) => console.error("[email send error]", err))

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/sitter/apply]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
