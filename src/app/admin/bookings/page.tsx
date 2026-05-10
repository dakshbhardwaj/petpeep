export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { money } from "@/lib/money"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Bookings — Admin" }

const ALL_STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const

type StatusFilter = (typeof ALL_STATUSES)[number]

const BADGE_VARIANT: Record<string, "warning" | "success" | "destructive" | "default" | "muted"> =
  {
    PENDING: "warning",
    CONFIRMED: "default",
    IN_PROGRESS: "success",
    COMPLETED: "muted",
    CANCELLED: "destructive",
    DISPUTED: "destructive",
  }

const SERVICE_LABEL: Record<string, string> = {
  DROP_IN_1HR: "1-hr drop-in",
  DROP_IN_2HR: "2-hr drop-in",
  DROP_IN_4HR: "4-hr drop-in",
}

interface PageProps {
  searchParams: { status?: string }
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/admin-login")

  const statusFilter = (searchParams.status?.toUpperCase() ?? "ALL") as StatusFilter

  const bookings = await prisma.booking.findMany({
    where:
      statusFilter === "ALL"
        ? undefined
        : { status: statusFilter as Exclude<StatusFilter, "ALL"> },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      parent: { include: { user: { select: { name: true, email: true } } } },
      sitter: { include: { user: { select: { name: true, email: true } } } },
      pets: { include: { pet: { select: { name: true, species: true } } } },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Bookings</h1>
        <p className="text-sm text-muted-foreground">{bookings.length} bookings shown</p>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${s}`}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    {/* Parent → Sitter */}
                    <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                      <span>{booking.parent.user.name}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{booking.sitter.user.name}</span>
                    </div>

                    {/* Pets */}
                    <p className="text-xs text-muted-foreground">
                      {booking.pets.map((bp) => bp.pet.name).join(", ")} ·{" "}
                      {SERVICE_LABEL[booking.serviceType] ?? booking.serviceType}
                    </p>

                    {/* Date + time */}
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {booking.startTime}–{booking.endTime}
                    </p>

                    {/* Amount */}
                    <p className="text-xs">
                      <span className="font-medium">{money.format(booking.totalAmount)}</span>
                      <span className="ml-2 text-muted-foreground">
                        (commission: {money.format(booking.platformFee)})
                      </span>
                      {booking.paymentConfirmed && (
                        <span className="ml-2 text-success">· Payment confirmed</span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Badge variant={BADGE_VARIANT[booking.status] ?? "default"}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
