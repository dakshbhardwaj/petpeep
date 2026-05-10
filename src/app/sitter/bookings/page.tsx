/**
 * /sitter/bookings — Sitter's booking requests and history.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { money } from "@/lib/money"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Bookings — Sitter" }

const BADGE_VARIANT: Record<string, "warning" | "success" | "destructive" | "default" | "muted"> =
  {
    PENDING: "warning",
    CONFIRMED: "default",
    IN_PROGRESS: "success",
    COMPLETED: "muted",
    CANCELLED: "destructive",
  }

const STATUS_LABEL: Record<string, string> = {
  PENDING: "New request",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

interface PageProps {
  searchParams: { tab?: string }
}

export default async function SitterBookingsPage({ searchParams }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const tabIdx = searchParams.tab === "past" ? 1 : 0
  const activeStatuses =
    tabIdx === 0
      ? ["PENDING", "CONFIRMED", "IN_PROGRESS"]
      : ["COMPLETED", "CANCELLED"]

  const sitter = await prisma.sitter.findUnique({
    where: { userId: authUser.id },
    include: {
      bookings: {
        where: { status: { in: activeStatuses as never[] } },
        orderBy: [{ date: tabIdx === 0 ? "asc" : "desc" }],
        include: {
          parent: { include: { user: { select: { name: true } } } },
          pets: { include: { pet: { select: { name: true, species: true } } } },
        },
      },
    },
  })

  if (!sitter) redirect("/sign-up")

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">My bookings</h1>
      </div>

      {/* Tab filter */}
      <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
        {["Upcoming", "Past"].map((label, i) => (
          <Link
            key={label}
            href={i === 0 ? "/sitter/bookings" : "/sitter/bookings?tab=past"}
            className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors ${
              tabIdx === i
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {sitter.bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {sitter.vettingStatus !== "APPROVED"
                ? "Booking requests will appear here once your application is approved."
                : tabIdx === 0
                  ? "No upcoming bookings right now."
                  : "No past bookings."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sitter.bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{booking.parent.user.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {booking.pets.map((bp) => bp.pet.name).join(", ")} ·{" "}
                      {new Date(booking.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {booking.startTime}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-success">
                      {money.format(booking.sitterEarnings)} earnings
                    </p>
                    {booking.status === "CONFIRMED" && !booking.paymentConfirmed && (
                      <p className="mt-0.5 text-xs text-warning">
                        Awaiting UPI payment from parent
                      </p>
                    )}
                  </div>
                  <Badge variant={BADGE_VARIANT[booking.status] ?? "default"}>
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
