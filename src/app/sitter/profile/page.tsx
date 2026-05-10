/**
 * /sitter/profile — Sitter profile and account settings.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "@/components/auth/logout-button"
import { money } from "@/lib/money"
import { Mail, MapPin, ExternalLink } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Profile — Sitter" }

const VETTING_INFO: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: "Under review", color: "text-warning", bg: "bg-warning/10" },
  ID_REVIEW: { label: "ID being verified", color: "text-secondary", bg: "bg-secondary/10" },
  QUIZ_PENDING: { label: "Quiz required", color: "text-secondary", bg: "bg-secondary/10" },
  QUIZ_FAILED: { label: "Quiz failed", color: "text-destructive", bg: "bg-destructive/10" },
  APPROVED: { label: "Approved & Active", color: "text-success", bg: "bg-success/10" },
  REJECTED: { label: "Application rejected", color: "text-destructive", bg: "bg-destructive/10" },
  SUSPENDED: { label: "Suspended", color: "text-destructive", bg: "bg-destructive/10" },
}

export default async function SitterProfilePage() {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { sitter: true },
  })

  if (!user?.sitter) redirect("/sign-up")

  const { sitter } = user
  const vettingInfo = VETTING_INFO[sitter.vettingStatus] ?? VETTING_INFO.PENDING

  const services = [
    sitter.hourlyRate1Hr && { label: "1-hr visit", rate: sitter.hourlyRate1Hr },
    sitter.hourlyRate2Hr && { label: "2-hr visit", rate: sitter.hourlyRate2Hr },
    sitter.hourlyRate4Hr && { label: "4-hr visit", rate: sitter.hourlyRate4Hr },
  ].filter(Boolean) as { label: string; rate: number }[]

  return (
    <div className="container max-w-lg py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">My profile</h1>
      </div>

      {/* Avatar + name */}
      <div className="mb-6 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xl font-bold">{user.name}</p>
          <div className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${vettingInfo.bg} ${vettingInfo.color}`}>
            {vettingInfo.label}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Application status card */}
        {sitter.vettingStatus !== "APPROVED" && (
          <div className={`rounded-xl p-4 ${vettingInfo.bg}`}>
            <p className={`font-semibold ${vettingInfo.color}`}>{vettingInfo.label}</p>
            {sitter.vettingStatus === "PENDING" && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Our team will review your application within 3–5 business days.
              </p>
            )}
            {sitter.vettingStatus === "REJECTED" && sitter.adminReviewNotes && (
              <p className="mt-0.5 text-sm text-muted-foreground">{sitter.adminReviewNotes}</p>
            )}
            {sitter.vettingStatus === "QUIZ_FAILED" && (
              <Link href="/sitter/apply" className="mt-1 block text-sm text-primary hover:underline">
                View application & retake quiz →
              </Link>
            )}
          </div>
        )}

        {/* Public profile link (approved only) */}
        {sitter.vettingStatus === "APPROVED" && (
          <Link href={`/sitters/${sitter.id}`} className="block">
            <Card className="cursor-pointer hover:shadow-card-hover transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">View public profile</p>
                  <p className="text-sm text-muted-foreground">
                    See how pet parents see your profile
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Account info */}
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <div className="flex items-center gap-3 p-4">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">City · Radius</p>
                <p className="text-sm font-medium">
                  {sitter.city} · {sitter.serviceRadiusKm} km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        {services.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                My Rates
              </p>
              <div className="space-y-1.5">
                {services.map((s) => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold">{money.format(s.rate)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pets accepted */}
        {(sitter.acceptsDogs || sitter.acceptsCats || sitter.acceptsOthers) && (
          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Accepts
              </p>
              <div className="flex gap-2 flex-wrap">
                {sitter.acceptsDogs && <Badge variant="default">🐕 Dogs</Badge>}
                {sitter.acceptsCats && <Badge variant="default">🐈 Cats</Badge>}
                {sitter.acceptsOthers && <Badge variant="default">🐾 Others</Badge>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz score */}
        {sitter.quizScore !== null && (
          <Card>
            <CardContent className="p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pet Care Quiz
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold font-display ${sitter.quizPassed ? "text-success" : "text-destructive"}`}>
                  {sitter.quizScore}%
                </span>
                <Badge variant={sitter.quizPassed ? "success" : "destructive"}>
                  {sitter.quizPassed ? "Passed" : "Failed"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit application */}
        <Link href="/sitter/apply">
          <Card className="cursor-pointer hover:shadow-card-hover transition-shadow">
            <CardContent className="p-4">
              <p className="font-medium text-primary">View / Edit application</p>
              <p className="text-sm text-muted-foreground">Update your bio, rates, and services</p>
            </CardContent>
          </Card>
        </Link>

        {/* Logout */}
        <LogoutButton />
      </div>
    </div>
  )
}
