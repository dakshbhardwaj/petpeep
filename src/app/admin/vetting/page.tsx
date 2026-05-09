/**
 * /admin/vetting — Sitter application queue.
 * Admins review, approve, or reject applications here.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vetting Queue — Admin",
}

const STATUS_OPTIONS = ["PENDING", "ID_REVIEW", "APPROVED", "REJECTED"] as const
type VettingStatus = (typeof STATUS_OPTIONS)[number]

const STATUS_BADGE: Record<VettingStatus, "warning" | "default" | "success" | "destructive"> = {
  PENDING: "warning",
  ID_REVIEW: "default",
  APPROVED: "success",
  REJECTED: "destructive",
}

interface PageProps {
  searchParams: { status?: string }
}

export default async function VettingQueuePage({ searchParams }: PageProps) {
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

  const status = (searchParams.status ?? "PENDING") as VettingStatus

  const applications = await prisma.sitterApplication.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: {
      sitter: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Vetting Queue</h1>
        <p className="text-sm text-muted-foreground">Review sitter applications</p>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={`/admin/vetting?status=${s}`}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === s
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {applications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No {status.toLowerCase()} applications right now.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application list */}
      <div className="space-y-3">
        {applications.map((app) => (
          <Link key={app.id} href={`/admin/vetting/${app.id}`}>
            <Card className="cursor-pointer hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{app.sitter.user.name}</p>
                      <Badge variant={STATUS_BADGE[app.status as VettingStatus] ?? "default"}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{app.sitter.user.email}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>📍 {app.city}</span>
                      {app.quizScore !== null && (
                        <span
                          className={
                            (app.quizScore ?? 0) >= 70 ? "text-success" : "text-destructive"
                          }
                        >
                          Quiz: {app.quizScore}%
                        </span>
                      )}
                      <span>
                        Submitted{" "}
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Doc status indicators */}
                  <div className="flex shrink-0 flex-col gap-1 text-right">
                    <span
                      className={`text-xs ${app.aadhaarDocUrl ? "text-success" : "text-muted-foreground"}`}
                    >
                      {app.aadhaarDocUrl ? "✅ Aadhaar" : "⬜ No Aadhaar"}
                    </span>
                    <span
                      className={`text-xs ${app.selfieUrl ? "text-success" : "text-muted-foreground"}`}
                    >
                      {app.selfieUrl ? "✅ Selfie" : "⬜ No selfie"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
