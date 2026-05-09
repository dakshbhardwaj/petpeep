"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Props {
  applicationId: string
}

export function VettingActions({ applicationId }: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)

  async function handleApprove() {
    setIsApproving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/vetting/${applicationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? "Failed to approve.")
        return
      }
      router.push("/admin/vetting")
      router.refresh()
    } finally {
      setIsApproving(false)
    }
  }

  async function handleReject() {
    setIsRejecting(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/vetting/${applicationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error ?? "Failed to reject.")
        return
      }
      router.push("/admin/vetting")
      router.refresh()
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="mt-8 space-y-4 rounded-xl border border-border bg-white p-4">
      <p className="font-semibold">Admin Decision</p>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Review notes (optional — sent to applicant on rejection)</Label>
        <Textarea
          id="notes"
          placeholder="Any notes for the applicant or internal team…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        {!showRejectForm ? (
          <>
            <Button
              variant="ghost"
              className="flex-1 border border-destructive text-destructive hover:bg-destructive/5"
              onClick={() => setShowRejectForm(true)}
            >
              Reject
            </Button>
            <Button className="flex-1" isLoading={isApproving} onClick={handleApprove}>
              ✓ Approve
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowRejectForm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-destructive text-white hover:bg-destructive/90"
              isLoading={isRejecting}
              onClick={handleReject}
            >
              Confirm rejection
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
