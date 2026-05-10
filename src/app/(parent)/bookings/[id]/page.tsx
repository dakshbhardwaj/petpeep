/**
 * /bookings/[id] — Parent booking detail page.
 *
 * Shows full booking info, UPI payment instructions (if CONFIRMED & unpaid),
 * and a cancel option for PENDING/CONFIRMED bookings.
 */
export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { money } from "@/lib/money"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, AlertTriangle, Clock, Info, CalendarDays, Timer } from "lucide-react"
import type { Metadata } from "next"
import type { BookingStatus, CancellationPolicy } from "@prisma/client"
import { CancelBookingForm } from "./_cancel-form"

export const metadata: Metadata = { title: "Booking Detail" }

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
  PENDING: "Awaiting confirmation",
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

export default async function ParentBookingDetailPage({ params }: PageProps) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const parent = await prisma.petParent.findUnique({
    where: { userId: authUser.id },
  })
  if (!parent) redirect("/sign-up")

  const booking = await prisma.booking.findUnique({
    where: { id: params.id, parentId: parent.id },
    include: {
      sitter: {
        include: {
          user: { select: { name: true, profilePhoto: true } },
        },
      },
      pets: {
        include: {
          pet: { select: { id: true, name: true, species: true } },
        },
      },
    },
  })

  if (!booking) notFound()

  const sitterFirstName = booking.sitter.user.name.split(" ")[0]
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED"

  const visitDateFormatted = new Date(booking.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="container max-w-lg py-6">
      {/* Back link */}
      <Link
        href="/bookings"
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        My bookings
      </Link>

      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Booking</h1>
        <Badge variant={BADGE_VARIANT[booking.status]}>
          {STATUS_LABEL[booking.status]}
        </Badge>
      </div>

      {/* UPI payment alert */}
      {booking.status === "CONFIRMED" && !booking.paymentConfirmed && (
        <div className="mb-4 flex gap-3 rounded-xl border border-warning/30 bg-warning-light p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-warning">Payment required</p>
            <p className="mt-0.5 text-sm text-warning/90">
              Please pay {sitterFirstName}{" "}
              <span className="font-bold">{money.format(booking.totalAmount)}</span> via UPI before
              the visit. Once paid, {sitterFirstName} will confirm receipt.
            </p>
          </div>
        </div>
      )}

      {/* Payment confirmed notice */}
      {booking.status === "CONFIRMED" && booking.paymentConfirmed && (
        <div className="mb-4 flex gap-3 rounded-xl border border-success/30 bg-success-light p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <p className="text-sm font-medium text-success">
            Payment confirmed — your visit is all set!
          </p>
        </div>
      )}

      {/* Pending notice */}
      {booking.status === "PENDING" && (
        <div className="mb-4 flex gap-3 rounded-xl border border-warning/30 bg-warning-light p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-warning">Waiting for sitter</p>
            {booking.sitterResponseDeadline && (
              <p className="mt-0.5 text-sm text-warning/90">
                {sitterFirstName} has until{" "}
                {new Date(booking.sitterResponseDeadline).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                today to respond.
              </p>
            )}
          </div>
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
            <p className="mt-2 text-sm">
              Refund: <span className="font-semibold">{REFUND_LABEL[booking.refundPolicy]}</span>
              {booking.refundAmount !== null && booking.refundAmount !== undefined && (
                <> — {money.format(booking.refundAmount)}</>
              )}
            </p>
          )}
        </div>
      )}

      {/* Sitter info */}
      <Card className="mb-4">
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage
              src={booking.sitter.user.profilePhoto ?? undefined}
              alt={booking.sitter.user.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {booking.sitter.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{booking.sitter.user.name}</p>
            <p className="text-sm text-muted-foreground">Your sitter</p>
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

          <div className="py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pets
            </p>
            <div className="flex flex-wrap gap-1.5">
              {booking.pets.map(({ pet }) => (
                <span
                  key={pet.id}
                  className="rounded-full bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
                >
                  {pet.name}
                </span>
              ))}
            </div>
          </div>

          {booking.notesToSitter && (
            <div className="pt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes to sitter
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {booking.notesToSitter}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment summary */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Total to sitter</span>
            <span className="text-lg font-bold">{money.format(booking.totalAmount)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pay via UPI directly to sitter</p>
          {booking.paymentNotes && (
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              UPI ref: {booking.paymentNotes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cancel button */}
      {canCancel && <CancelBookingForm bookingId={booking.id} />}
    </div>
  )
}
