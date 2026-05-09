/**
 * /sitter/apply — Sitter application wizard.
 * Server component wrapper — checks if application already submitted.
 * Renders the wizard client component for new applicants.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Metadata } from "next"
import { SitterApplicationWizard } from "./_wizard"

export const metadata: Metadata = {
  title: "Apply to be a Sitter — PetPeep",
}

export default async function SitterApplyPage() {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      sitter: {
        include: { application: true },
      },
    },
  })

  if (!user?.sitter) redirect("/sign-up")

  const { sitter } = user

  // Already approved — nothing to do here
  if (sitter.vettingStatus === "APPROVED") {
    return (
      <div className="container py-12 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-success">You&apos;re approved!</h1>
          <p className="mt-2 text-muted-foreground">
            Your profile is live and pet parents can already find you.
          </p>
          <Link
            href="/sitter/dashboard"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Application submitted — show status
  if (sitter.application && sitter.vettingStatus === "PENDING") {
    return (
      <div className="container py-12 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="font-display text-xl font-bold">Application under review</h1>
          <p className="mt-2 text-muted-foreground">
            We received your application on{" "}
            {sitter.application.createdAt.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            . Our team will review it within 3–5 business days.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            You&apos;ll receive an email at <strong>{user.email}</strong> when we have an update.
          </p>
          <Link
            href="/sitter/dashboard"
            className="mt-6 inline-block text-sm text-primary hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Show the wizard (new applicant or re-applicant after rejection)
  return (
    <SitterApplicationWizard
      sitterId={sitter.id}
      quizPassed={sitter.quizPassed}
      quizScore={sitter.quizScore}
      quizLastAttempt={sitter.quizLastAttempt?.toISOString() ?? null}
      existingCity={sitter.city}
    />
  )
}
