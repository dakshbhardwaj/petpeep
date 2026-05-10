"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { BookingStatus } from "@prisma/client"

interface BookingActionsProps {
  bookingId: string
  status: BookingStatus
  paymentConfirmed: boolean
  isDeadlineExpired: boolean
}

export function BookingActions({
  bookingId,
  status,
  paymentConfirmed,
  isDeadlineExpired,
}: BookingActionsProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setError(null)
    setIsAccepting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to accept booking.")
        return
      }
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsAccepting(false)
    }
  }

  async function handleDecline() {
    setError(null)
    setIsDeclining(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/decline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason || undefined }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to decline booking.")
        return
      }
      router.refresh()
      setShowDeclineForm(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsDeclining(false)
    }
  }

  async function handleConfirmPayment() {
    setError(null)
    setIsConfirmingPayment(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentNotes: paymentNotes || undefined }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to confirm payment.")
        return
      }
      router.refresh()
      setShowPaymentForm(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-destructive">{error}</p>
        <Button variant="outline" className="w-full" onClick={() => setError(null)}>
          Try again
        </Button>
      </div>
    )
  }

  // PENDING booking: Accept + Decline
  if (status === "PENDING" && !isDeadlineExpired) {
    if (showDeclineForm) {
      return (
        <div className="rounded-xl border border-destructive/20 bg-red-50 p-5">
          <p className="mb-3 font-semibold text-destructive">Decline this booking?</p>
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="declineReason" className="text-sm">
              Reason (optional — shown to parent)
            </Label>
            <Textarea
              id="declineReason"
              placeholder="I&apos;m unavailable on that date…"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeclineForm(false)}
              disabled={isDeclining}
            >
              Go back
            </Button>
            <Button
              className="flex-1 bg-destructive hover:bg-destructive/90"
              onClick={handleDecline}
              isLoading={isDeclining}
              disabled={isDeclining}
            >
              Decline
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-destructive text-destructive hover:bg-red-50"
          onClick={() => setShowDeclineForm(true)}
          disabled={isAccepting}
        >
          Decline
        </Button>
        <Button
          className="flex-1"
          onClick={handleAccept}
          isLoading={isAccepting}
          disabled={isAccepting}
        >
          Accept booking
        </Button>
      </div>
    )
  }

  // CONFIRMED + payment not yet confirmed: show confirm payment
  if (status === "CONFIRMED" && !paymentConfirmed) {
    if (showPaymentForm) {
      return (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="mb-1 font-semibold">Confirm UPI payment received</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Only confirm once you&apos;ve actually received the payment.
          </p>
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="paymentNotes" className="text-sm">
              UPI transaction reference (optional)
            </Label>
            <Input
              id="paymentNotes"
              placeholder="e.g. UPI/12345678"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPaymentForm(false)}
              disabled={isConfirmingPayment}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmPayment}
              isLoading={isConfirmingPayment}
              disabled={isConfirmingPayment}
            >
              Confirm received
            </Button>
          </div>
        </div>
      )
    }

    return (
      <Button className="w-full" onClick={() => setShowPaymentForm(true)}>
        Confirm Payment Received
      </Button>
    )
  }

  // No actions available
  return null
}
