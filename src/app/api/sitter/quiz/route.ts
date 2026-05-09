/**
 * POST /api/sitter/quiz
 *
 * Scores the pet care knowledge quiz submission server-side.
 * Enforces 7-day retry cooldown on failure.
 *
 * Auth: required (SITTER only)
 * Input: { answers: number[] } — one answer index per question, in order
 * Output: { score, passed, passMark, retryAvailableAt? }
 */
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { QUIZ_QUESTIONS, PASS_MARK, QUIZ_COOLDOWN_DAYS, TOTAL_QUESTIONS } from "@/lib/quiz"
import { z } from "zod"
import { addDays } from "date-fns"

const schema = z.object({
  answers: z
    .array(z.number().int().min(0).max(3))
    .length(TOTAL_QUESTIONS, `Must answer all ${TOTAL_QUESTIONS} questions`),
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

    // Get sitter record
    const sitter = await prisma.sitter.findUnique({
      where: { userId: authUser.id },
    })

    if (!sitter) {
      return NextResponse.json({ error: "Sitter profile not found" }, { status: 404 })
    }

    // Already passed
    if (sitter.quizPassed) {
      return NextResponse.json({
        score: sitter.quizScore,
        passed: true,
        passMark: PASS_MARK,
        message: "You have already passed the quiz.",
      })
    }

    // Enforce retry cooldown
    if (sitter.quizLastAttempt) {
      const retryAvailableAt = addDays(sitter.quizLastAttempt, QUIZ_COOLDOWN_DAYS)
      if (new Date() < retryAvailableAt) {
        return NextResponse.json(
          {
            error: "Quiz retry not yet available",
            retryAvailableAt: retryAvailableAt.toISOString(),
          },
          { status: 429 }
        )
      }
    }

    const body = schema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json(
        { error: "Invalid input", details: body.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { answers } = body.data

    // Score the quiz server-side using correct answers from QUIZ_QUESTIONS
    let correct = 0
    for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
      if (answers[i] === QUIZ_QUESTIONS[i].correctIndex) {
        correct++
      }
    }

    const score = Math.round((correct / TOTAL_QUESTIONS) * 100)
    const passed = score >= PASS_MARK

    // Persist result to Sitter record
    await prisma.sitter.update({
      where: { id: sitter.id },
      data: {
        quizScore: score,
        quizPassed: passed,
        quizLastAttempt: new Date(),
        vettingStatus: passed ? "PENDING" : "QUIZ_FAILED",
      },
    })

    if (passed) {
      return NextResponse.json({ score, passed: true, passMark: PASS_MARK })
    }

    const retryAvailableAt = addDays(new Date(), QUIZ_COOLDOWN_DAYS)
    return NextResponse.json({
      score,
      passed: false,
      passMark: PASS_MARK,
      retryAvailableAt: retryAvailableAt.toISOString(),
    })
  } catch (error) {
    console.error("[POST /api/sitter/quiz]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
