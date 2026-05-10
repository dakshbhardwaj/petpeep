/**
 * /bookings — Parent's booking history.
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

export const metadata: Metadata = { title: "My Bookings" }

const STATUS_TABS = [
  { label: "Upcoming", statuses: ["PENDING", "CONFIRMED", "IN_PROGRESS"] as const },
  { label: "Past", statuses: ["COMPLETED", "CANCELLED"] as const },
]

const BADGE_VARIANT: Record<string, "warning" | "success" | "destructive" | "default" | "muted"> =
  {
    PENDING: "warning",
    CONFIRMED: "default",
    IN_PROGRESS: "success",
    COMPLETED: "muted",
    CANCELLED: "destructive",
  }

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

interface PageProps {
  searchParams: { tab?: string }
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const tabIdx = searchParams.tab === "past" ? 1 : 0
  const activeStatuses = [...STATUS_TABS[tabIdx].statuses]

  const parent = await prisma.petParent.findUnique({
    where: { userId: authUser.id },
    include: {
      bookings: {
        where: { status: { in: activeStatuses as never[] } },
        orderBy: [{ date: tabIdx === 0 ? "asc" : "desc" }],
        include: {
          sitter: { include: { user: { select: { name: true } } } },
          pets: { include: { pet: { select: { name: true, species: true } } } },
        },
      },
    },
  })

  if (!parent) redirect("/sign-up")

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">My bookings</h1>
      </div>

      {/* Tab filter */}
      <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
        {STATUS_TABS.map((tab, i) => (
          <Link
            key={tab.label}
            href={i === 0 ? "/bookings" : "/bookings?tab=past"}
            className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors ${
              tabIdx === i
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {parent.bookings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {tabIdx === 0 ? "No upcoming bookings" : "No past bookings"}
            </p>
            {tabIdx === 0 && (
              <Link href="/search" className="mt-2 block text-sm text-primary hover:underline">
                Find a sitter
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {parent.bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{booking.sitter.user.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {booking.pets.map((bp) => bp.pet.name).join(", ")} ·{" "}
                    {new Date(booking.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {booking.startTime}
                  </p>
                  <p className="mt-1 text-sm font-medium">{money.format(booking.totalAmount)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant={BADGE_VARIANT[booking.status] ?? "default"}>
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </Badge>
                  {!booking.paymentConfirmed && booking.status === "CONFIRMED" && (
                    <span className="text-xs text-warning">Payment pending</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
