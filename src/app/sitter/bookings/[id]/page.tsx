/**
 * /sitter/bookings/[id] — Sitter booking detail page.
 *
 * Shows full booking info with accept/decline buttons for PENDING bookings,
 * and a "Confirm Payment Received" button for CONFIRMED + unpaid bookings.
 */
export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { money } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, AlertTriangle, CalendarDays, Timer, Info } from "lucide-react"
import type { Metadata } from "next"
import type { BookingStatus, CancellationPolicy } from "@prisma/client"
import { BookingActions } from "./_booking-actions"

export const metadata: Metadata = { title: "Booking Request — Sitter" }

const BADGE_VARIANT: Record<
  BookingStatus,
  "warning" | "success" | "destructive" | "default" | "muted"
> = {
  PENDING: "warning",
  CONFIRMED: "default",
  IN_PROGRESS: "success",
  COMPLETED: "muted",
  CANCELLED: "destructive",
  DISPUTED: "destructive",
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "New request",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
}

const SERVICE_LABEL: Record<string, string> = {
  DROP_IN_1HR: "1-hour drop-in",
  DROP_IN_2HR: "2-hour drop-in",
  DROP_IN_4HR: "4-hour drop-in",
}

const REFUND_LABEL: Record<CancellationPolicy, string> = {
  FULL_REFUND: "Full refund",
  PARTIAL_REFUND: "50% refund",
  NO_REFUND: "No refund",
}

interface PageProps {
  params: { id: string }
}

export default async function SitterBookingDetailPage({ params }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const sitter = await prisma.sitter.findUnique({
    where: { userId: authUser.id },
  })
  if (!sitter) redirect("/sign-up")

  const booking = await prisma.booking.findUnique({
    where: { id: params.id, sitterId: sitter.id },
    include: {
      parent: {
        include: {
          user: { select: { name: true, profilePhoto: true } },
        },
      },
      pets: {
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
              breed: true,
              age: true,
              hasEverBitten: true,
              reactiveToStrangers: true,
              behavioralNotes: true,
            },
          },
        },
      },
    },
  })

  if (!booking) notFound()

  const visitDateFormatted = new Date(booking.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const isResponseDeadlineExpired =
    booking.sitterResponseDeadline
      ? booking.sitterResponseDeadline < new Date()
      : false

  return (
    <div className="container max-w-lg py-6">
      {/* Back link */}
      <Link
        href="/sitter/bookings"
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        My bookings
      </Link>

      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Booking request</h1>
        <Badge variant={BADGE_VARIANT[booking.status]}>
          {STATUS_LABEL[booking.status]}
        </Badge>
      </div>

      {/* Response deadline warning */}
      {booking.status === "PENDING" && booking.sitterResponseDeadline && (
        <div className="mb-4 flex gap-3 rounded-xl border border-warning/30 bg-warning-light p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {isResponseDeadlineExpired ? "Response window expired" : "Action required"}
            </p>
            <p className="mt-0.5 text-sm text-warning/90">
              {isResponseDeadlineExpired
                ? "This booking expired — the parent will need to rebook."
                : `Respond by ${new Date(booking.sitterResponseDeadline).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} or the booking will auto-cancel.`}
            </p>
          </div>
        </div>
      )}

      {/* UPI awaiting notice */}
      {booking.status === "CONFIRMED" && !booking.paymentConfirmed && (
        <div className="mb-4 flex gap-3 rounded-xl border border-warning/30 bg-warning-light p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm font-medium text-warning">
            Waiting for parent to pay via UPI. Once paid, tap &ldquo;Confirm Payment Received&rdquo;
            below.
          </p>
        </div>
      )}

      {/* Payment confirmed notice */}
      {booking.status === "CONFIRMED" && booking.paymentConfirmed && (
        <div className="mb-4 flex gap-3 rounded-xl border border-success/30 bg-success-light p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <p className="text-sm font-medium text-success">
            Payment confirmed. The visit is on!
          </p>
        </div>
      )}

      {/* Cancellation info */}
      {booking.status === "CANCELLED" && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-red-50 p-4">
          <p className="text-sm font-semibold text-destructive">Booking cancelled</p>
          {booking.cancellationReason && (
            <p className="mt-1 text-sm text-muted-foreground">{booking.cancellationReason}</p>
          )}
          {booking.refundPolicy && (
            <p className="mt-1 text-sm">
              Refund policy: {REFUND_LABEL[booking.refundPolicy]}
            </p>
          )}
        </div>
      )}

      {/* Parent info */}
      <Card className="mb-4">
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage
              src={booking.parent.user.profilePhoto ?? undefined}
              alt={booking.parent.user.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {booking.parent.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{booking.parent.user.name}</p>
            <p className="text-sm text-muted-foreground">Pet parent</p>
          </div>
        </CardContent>
      </Card>

      {/* Visit details */}
      <Card className="mb-4">
        <CardContent className="divide-y divide-border p-5">
          <div className="pb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Service
            </p>
            <p className="font-medium">{SERVICE_LABEL[booking.serviceType]}</p>
          </div>

          <div className="py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date
            </p>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{visitDateFormatted}</p>
            </div>
          </div>

          <div className="py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Time
            </p>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">
                {booking.startTime} – {booking.endTime}
              </p>
            </div>
          </div>

          {booking.notesToSitter && (
            <div className="pt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes from parent
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {booking.notesToSitter}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pets */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pets ({booking.pets.length})
          </p>
          <div className="space-y-3">
            {booking.pets.map(({ pet }) => (
              <div key={pet.id} className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{pet.name}</p>
                  <span className="text-xs text-muted-foreground capitalize">
                    {pet.species.toLowerCase()}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                    {pet.age ? ` · ${Math.floor(pet.age / 12)}y ${pet.age % 12}m` : ""}
                  </span>
                </div>
                {pet.hasEverBitten && (
                  <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-red-100 px-2.5 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-medium text-destructive">
                      Has bitten before
                    </span>
                  </div>
                )}
                {pet.reactiveToStrangers && (
                  <p className="mt-1 text-xs text-warning">
                    Reactive to strangers
                  </p>
                )}
                {pet.behavioralNotes && (
                  <p className="mt-1 text-xs text-muted-foreground">{pet.behavioralNotes}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Earnings summary */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your earnings
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Parent pays</span>
            <span className="text-sm font-medium">{money.format(booking.totalAmount)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-sm">Platform commission (15%)</span>
            <span className="text-sm text-muted-foreground">−{money.format(booking.platformFee)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="font-semibold">Your earnings</span>
            <span className="text-lg font-bold text-success">
              {money.format(booking.sitterEarnings)}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Parent pays via UPI directly to you. Platform commission paid separately.
          </p>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <BookingActions
        bookingId={booking.id}
        status={booking.status}
        paymentConfirmed={booking.paymentConfirmed}
        isDeadlineExpired={isResponseDeadlineExpired}
      />
    </div>
  )
}
