/**
 * Admin SOS Alerts page — Server Component.
 * Admin-only (layout.tsx enforces this for all /admin routes).
 */
export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ShieldAlert, CheckCircle, Clock, User, PawPrint } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SOS Alerts — Admin",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAlertTime(date: Date): string {
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  if (isToday) {
    return `Today at ${timeStr}`
  }

  const dateStr = date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  })
  return `${dateStr} at ${timeStr}`
}

function formatBookingDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Resolve form ─────────────────────────────────────────────────────────────

function ResolveForm({ alertId }: { alertId: string }) {
  return (
    <form
      action={`/api/admin/sos/${alertId}/resolve`}
      method="POST"
      // We use a client-side fetch via a submit handler in a real app,
      // but for a Next.js server action pattern we redirect on success.
      // For MVP, a simple form POST that round-trips through the API works.
      className="mt-4 flex flex-col gap-2"
    >
      <input type="hidden" name="_method" value="PATCH" />
      <textarea
        name="resolutionNotes"
        rows={2}
        placeholder="Resolution notes (optional)…"
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        type="submit"
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        Mark Resolved
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminSOSPage() {
  const alerts = await prisma.sOSAlert.findMany({
    orderBy: { triggeredAt: "desc" },
    include: {
      triggeredBy: true,
      booking: {
        include: {
          parent: { include: { user: true } },
          sitter: { include: { user: true } },
          pets: { include: { pet: true } },
        },
      },
    },
  })

  const activeAlerts = alerts.filter((a) => a.resolvedAt === null)
  const resolvedAlerts = alerts.filter((a) => a.resolvedAt !== null)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-7 w-7 text-destructive" />
        <div>
          <h1 className="font-display text-2xl font-bold">SOS Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Emergency alerts triggered during active visits
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <Badge variant="destructive" className="ml-auto text-sm">
            {activeAlerts.length} active
          </Badge>
        )}
      </div>

      {/* Active Alerts */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">Active Alerts</h2>

        {activeAlerts.length === 0 ? (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="flex items-center gap-3 p-6">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-success">All clear</p>
                <p className="text-sm text-muted-foreground">
                  No active SOS alerts at this time.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeAlerts.map((alert) => {
              const petNames = alert.booking.pets
                .map((bp) => bp.pet.name)
                .join(", ")

              return (
                <Card
                  key={alert.id}
                  className="border-destructive bg-destructive/5"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="uppercase tracking-wide text-xs">
                          ACTIVE
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatAlertTime(alert.triggeredAt)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {alert.id.slice(-8)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Booking details */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Parent</p>
                          <p className="text-sm font-medium">
                            {alert.booking.parent.user.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sitter</p>
                          <p className="text-sm font-medium">
                            {alert.booking.sitter.user.name}
                          </p>
                        </div>
                      </div>

                      {petNames && (
                        <div className="flex items-start gap-2">
                          <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Pets</p>
                            <p className="text-sm font-medium">{petNames}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Visit date / time</p>
                          <p className="text-sm font-medium">
                            {formatBookingDate(alert.booking.date)},{" "}
                            {alert.booking.startTime}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Triggered by */}
                    <p className="text-xs text-muted-foreground">
                      Triggered by{" "}
                      <span className="font-medium text-foreground">
                        {alert.triggeredBy.name}
                      </span>
                      {" "}({alert.triggeredBy.userType.toLowerCase()})
                    </p>

                    {/* Description */}
                    {alert.description && (
                      <div className="rounded-md border border-destructive/20 bg-white px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Description
                        </p>
                        <p className="text-sm">{alert.description}</p>
                      </div>
                    )}

                    {/* Resolve form */}
                    <ResolveForm alertId={alert.id} />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-muted-foreground">
            Resolved ({resolvedAlerts.length})
          </h2>

          <div className="space-y-3">
            {resolvedAlerts.map((alert) => {
              const petNames = alert.booking.pets
                .map((bp) => bp.pet.name)
                .join(", ")

              return (
                <Card key={alert.id} className="border-border opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Resolved
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Triggered {formatAlertTime(alert.triggeredAt)}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {alert.booking.parent.user.name}
                          </span>{" "}
                          &rarr;{" "}
                          <span className="font-medium text-foreground">
                            {alert.booking.sitter.user.name}
                          </span>
                          {petNames && (
                            <span className="ml-1 text-muted-foreground">
                              · {petNames}
                            </span>
                          )}
                        </p>

                        {alert.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            &ldquo;{alert.description}&rdquo;
                          </p>
                        )}

                        {alert.resolutionNotes && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Notes:</span>{" "}
                            {alert.resolutionNotes}
                          </p>
                        )}
                      </div>

                      {alert.resolvedAt && (
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">
                            Resolved
                          </p>
                          <p className="text-xs font-medium">
                            {formatAlertTime(alert.resolvedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
