"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface CancelBookingFormProps {
  bookingId: string
}

export function CancelBookingForm({ bookingId }: CancelBookingFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to cancel booking.")
        return
      }
      router.refresh()
      setIsOpen(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-red-50"
        onClick={() => setIsOpen(true)}
      >
        Cancel booking
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-destructive/20 bg-red-50 p-5">
      <p className="mb-3 font-semibold text-destructive">Cancel this booking?</p>

      <div className="mb-4 space-y-1.5">
        <Label htmlFor="cancelReason" className="text-sm">
          Reason (optional)
        </Label>
        <Textarea
          id="cancelReason"
          placeholder="Let us know why you're cancelling…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setIsOpen(false)}
          disabled={isLoading}
        >
          Keep booking
        </Button>
        <Button
          className="flex-1 bg-destructive hover:bg-destructive/90"
          onClick={handleCancel}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Yes, cancel
        </Button>
      </div>
    </div>
  )
}
