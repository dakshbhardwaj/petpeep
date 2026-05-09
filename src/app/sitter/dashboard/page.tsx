/**
 * Sitter dashboard — Server Component.
 * Shows upcoming bookings to handle, vetting status, and earnings summary.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { money } from "@/lib/money"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sitter Dashboard",
}

export default async function SitterDashboardPage() {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      sitter: {
        include: {
          bookings: {
            where: { status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
            orderBy: { date: "asc" },
            take: 5,
            include: {
              parent: { include: { user: { select: { name: true } } } },
              pets: { include: { pet: { select: { name: true, species: true } } } },
            },
          },
        },
      },
    },
  })

  if (!user?.sitter) redirect("/sign-up")

  const { sitter } = user
  const isApproved = sitter.vettingStatus === "APPROVED"

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Hi, {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">Your sitter dashboard</p>
      </div>

      {/* Vetting status banner */}
      {!isApproved && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl p-4 ${
            sitter.vettingStatus === "PENDING"
              ? "bg-warning-light text-warning"
              : sitter.vettingStatus === "APPROVED"
                ? "bg-success-light text-success"
                : "bg-red-50 text-destructive"
          }`}
        >
          {sitter.vettingStatus === "PENDING" ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {sitter.vettingStatus === "PENDING" && "Application under review"}
              {sitter.vettingStatus === "ID_REVIEW" && "ID documents being verified"}
              {sitter.vettingStatus === "QUIZ_PENDING" && "Complete your pet care quiz"}
              {sitter.vettingStatus === "QUIZ_FAILED" && "Quiz not passed — retry available"}
              {sitter.vettingStatus === "REJECTED" && "Application not approved"}
            </p>
            <p className="text-sm opacity-80">
              {sitter.vettingStatus === "PENDING" &&
                "We'll review your application within 3–5 business days."}
              {sitter.vettingStatus === "QUIZ_PENDING" && (
                <Link href="/sitter/apply/quiz" className="underline">
                  Take the quiz now →
                </Link>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Pending booking requests */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display font-semibold">Booking requests</h2>
          <Link href="/sitter/bookings" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {sitter.bookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {isApproved
                  ? "No pending requests right now"
                  : "Requests will appear here once you're approved"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sitter.bookings.map((booking) => (
              <Link key={booking.id} href={`/sitter/bookings/${booking.id}`}>
                <Card className="cursor-pointer hover:shadow-card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{booking.parent.user.name}</p>
                        <p className="text-sm text-muted-foreground">
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
                      </div>
                      <Badge
                        variant={
                          booking.status === "PENDING"
                            ? "warning"
                            : booking.status === "IN_PROGRESS"
                              ? "success"
                              : "default"
                        }
                      >
                        {booking.status === "PENDING"
                          ? "New request"
                          : booking.status === "IN_PROGRESS"
                            ? "In progress"
                            : "Confirmed"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
