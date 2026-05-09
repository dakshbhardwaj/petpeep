/**
 * /admin/vetting/[id] — Application detail + approve/reject actions.
 */
export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"
import { VettingActions } from "./_actions"

export const metadata: Metadata = {
  title: "Review Application — Admin",
}

interface PageProps {
  params: { id: string }
}

export default async function VettingDetailPage({ params }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect("/login")

  const adminUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { userType: true },
  })

  if (adminUser?.userType !== "ADMIN") redirect("/dashboard")

  const application = await prisma.sitterApplication.findUnique({
    where: { id: params.id },
    include: {
      sitter: {
        include: {
          user: { select: { name: true, email: true, phone: true, createdAt: true } },
        },
      },
    },
  })

  if (!application) notFound()

  const { sitter } = application

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/vetting"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Vetting queue
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{sitter.user.name}</h1>
          <p className="text-sm text-muted-foreground">{sitter.user.email}</p>
          {sitter.user.phone && (
            <p className="text-sm text-muted-foreground">📞 {sitter.user.phone}</p>
          )}
        </div>
        <Badge
          variant={
            application.status === "APPROVED"
              ? "success"
              : application.status === "REJECTED"
                ? "destructive"
                : application.status === "PENDING"
                  ? "warning"
                  : "default"
          }
        >
          {application.status}
        </Badge>
      </div>

      {/* Application details */}
      <div className="space-y-4">
        <Section title="Bio">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {sitter.bio ?? <span className="text-muted-foreground italic">Not provided</span>}
          </p>
        </Section>

        <Section title="Pet Care Experience">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{application.petExperience}</p>
        </Section>

        {application.motivation && (
          <Section title="Motivation">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{application.motivation}</p>
          </Section>
        )}

        {sitter.homeEnvironment && (
          <Section title="Home Environment">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{sitter.homeEnvironment}</p>
          </Section>
        )}

        <Section title="Services">
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">City:</span> {application.city}
            </p>
            <p>
              <span className="text-muted-foreground">Radius:</span> {sitter.serviceRadiusKm} km
            </p>
            <p>
              <span className="text-muted-foreground">Accepts:</span>{" "}
              {[
                sitter.acceptsDogs && "Dogs",
                sitter.acceptsCats && "Cats",
                sitter.acceptsOthers && "Others",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            {sitter.hourlyRate1Hr && (
              <p>
                <span className="text-muted-foreground">1-hr rate:</span> ₹
                {sitter.hourlyRate1Hr / 100}
              </p>
            )}
            {sitter.hourlyRate2Hr && (
              <p>
                <span className="text-muted-foreground">2-hr rate:</span> ₹
                {sitter.hourlyRate2Hr / 100}
              </p>
            )}
            {sitter.hourlyRate4Hr && (
              <p>
                <span className="text-muted-foreground">4-hr rate:</span> ₹
                {sitter.hourlyRate4Hr / 100}
              </p>
            )}
          </div>
        </Section>

        {/* Quiz score */}
        <Section title="Pet Care Quiz">
          {application.quizScore !== null ? (
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold font-display ${
                  (application.quizScore ?? 0) >= 70 ? "text-success" : "text-destructive"
                }`}
              >
                {application.quizScore}%
              </span>
              <Badge variant={(application.quizScore ?? 0) >= 70 ? "success" : "destructive"}>
                {(application.quizScore ?? 0) >= 70 ? "Passed" : "Failed"}
              </Badge>
              {application.quizPassedAt && (
                <span className="text-xs text-muted-foreground">
                  Passed on{" "}
                  {new Date(application.quizPassedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Quiz not yet taken</p>
          )}
        </Section>

        {/* ID documents */}
        <Section title="ID Documents">
          <div className="space-y-3">
            {application.aadhaarDocUrl ? (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Aadhaar card</p>
                {application.aadhaarDocUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={application.aadhaarDocUrl}
                    alt="Aadhaar document"
                    className="max-h-48 rounded-lg border object-contain"
                  />
                ) : (
                  <a
                    href={application.aadhaarDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Aadhaar document ↗
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No Aadhaar uploaded</p>
            )}

            {application.selfieUrl ? (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Selfie</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={application.selfieUrl}
                  alt="Applicant selfie"
                  className="max-h-48 rounded-lg border object-contain"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No selfie uploaded</p>
            )}
          </div>
        </Section>

        {/* Submitted date */}
        <div className="text-xs text-muted-foreground">
          Application submitted{" "}
          {new Date(application.createdAt).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Actions — client component for interactivity */}
      {application.status === "PENDING" || application.status === "ID_REVIEW" ? (
        <VettingActions applicationId={params.id} />
      ) : (
        application.reviewNotes && (
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Review notes</p>
            <p className="mt-1 text-sm">{application.reviewNotes}</p>
          </div>
        )
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}
