"use client"
// Needs "use client" — uses useState, useEffect, Supabase Realtime,
// and the useBookingChat hook for real-time chat.

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useBookingChat } from "@/hooks/useBookingChat"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Camera,
  MessageCircle,
  Star,
  Send,
  Loader2,
  Clock,
  CheckCircle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"

type Pet = { name: string; species: string }

type BookingDetail = {
  id: string
  status: BookingStatus
  date: string
  startTime: string
  endTime: string
  sitter: {
    user: { name: string; profilePhoto: string | null }
  }
  pets: Array<{ pet: Pet }>
}

type PhotoUpdate = {
  id: string
  photoUrl: string
  caption: string | null
  sentAt: string
}

// ─── Chat widget ─────────────────────────────────────────────────────────────

function ChatWidget({
  bookingId,
  currentUserId,
  sitterName,
}: {
  bookingId: string
  currentUserId: string
  sitterName: string
}) {
  const { messages, isLoading, sendMessage } = useBookingChat(bookingId)
  const [draft, setDraft] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const content = draft.trim()
    if (!content || isSending) return
    setIsSending(true)
    setDraft("")
    try {
      await sendMessage(content)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-72 flex-col rounded-lg border">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <p className="text-center text-xs text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            No messages yet — say hi to {sitterName}!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t p-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${sitterName}…`}
          className="min-h-0 flex-1 resize-none py-2 text-sm"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!draft.trim() || isSending}
          className="self-end"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-colors"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`h-7 w-7 ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParentLiveBookingPage() {
  const { id: bookingId } = useParams<{ id: string }>()

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [photos, setPhotos] = useState<PhotoUpdate[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Review form state
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Load booking, photos, and current user
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })

    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((data: { booking?: BookingDetail }) => {
        if (data.booking) setBooking(data.booking)
        setIsPageLoading(false)
      })
      .catch(() => setIsPageLoading(false))

    fetch(`/api/bookings/${bookingId}/photos`)
      .then((r) => r.json())
      .then((data: { photos?: PhotoUpdate[] }) => {
        setPhotos(data.photos ?? [])
      })
      .catch(() => {})
  }, [bookingId])

  // Subscribe to realtime photo updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`booking-photos-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "PhotoUpdate",
          filter: `bookingId=eq.${bookingId}`,
        },
        (payload) => {
          setPhotos((prev) => [...prev, payload.new as PhotoUpdate])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  // ── Review submission ─────────────────────────────────────────────────────

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setReviewError("Please select a star rating.")
      return
    }
    setIsSubmittingReview(true)
    setReviewError(null)

    try {
      const res = await fetch(`/api/bookings/${bookingId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      })
      const data: { review?: unknown; error?: string } = await res.json()

      if (!res.ok) {
        setReviewError(data.error ?? "Could not submit review. Please try again.")
        return
      }

      setReviewSubmitted(true)
    } catch {
      setReviewError("Something went wrong. Please try again.")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isPageLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container py-10">
        <p className="text-muted-foreground">Booking not found.</p>
        <Link href="/bookings" className="mt-2 text-sm text-primary hover:underline">
          Back to bookings
        </Link>
      </div>
    )
  }

  const sitterName = booking.sitter.user.name
  const petNames = booking.pets.map((bp) => bp.pet.name).join(", ")
  const visitDate = new Date(booking.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const isLive = booking.status === "IN_PROGRESS"
  const isCompleted = booking.status === "COMPLETED"
  const hasStarted = isLive || isCompleted

  const statusBadgeVariant = {
    PENDING: "warning" as const,
    CONFIRMED: "default" as const,
    IN_PROGRESS: "success" as const,
    COMPLETED: "muted" as const,
    CANCELLED: "destructive" as const,
    DISPUTED: "destructive" as const,
  }[booking.status] ?? ("default" as const)

  const statusLabel = {
    PENDING: "Awaiting confirmation",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "Visit in progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    DISPUTED: "Disputed",
  }[booking.status] ?? booking.status

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* ── Header ── */}
      <div>
        <Link
          href="/bookings"
          className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← My bookings
        </Link>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-lg">Visit with {sitterName}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {petNames} · {visitDate} · {booking.startTime}–{booking.endTime}
                </p>
              </div>
              <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Pre-visit placeholder ── */}
      {!hasStarted && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">The visit hasn&apos;t started yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {sitterName} will check in when they arrive. You&apos;ll see live photo
              updates and can chat here once the visit begins.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Photo feed (shown when visit has started) ── */}
      {hasStarted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-primary" />
              Photo updates
              {isLive && (
                <span className="ml-auto flex items-center gap-1 text-xs font-normal text-success">
                  <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
                  Live
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {isLive
                  ? "Waiting for the first photo update…"
                  : "No photos were sent during this visit."}
              </p>
            ) : (
              <div className="space-y-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-xl">
                    <div className="relative aspect-video w-full bg-muted">
                      <Image
                        src={photo.photoUrl}
                        alt={photo.caption ?? `Photo update from ${sitterName}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 672px"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1 pt-1.5">
                      {photo.caption && (
                        <p className="text-sm text-foreground">{photo.caption}</p>
                      )}
                      <p className="ml-auto text-xs text-muted-foreground">
                        {new Date(photo.sentAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Chat section ── */}
      {hasStarted && currentUserId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-primary" />
              Chat with {sitterName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChatWidget
              bookingId={bookingId}
              currentUserId={currentUserId}
              sitterName={sitterName}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Review section (shown after visit is completed) ── */}
      {isCompleted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-primary" />
              Leave a Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewSubmitted ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle className="h-8 w-8 text-success" />
                <p className="font-medium">Thank you for your review!</p>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps the PetPeep community.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">How was {sitterName}?</p>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="reviewComment"
                    className="text-sm font-medium"
                  >
                    Add a comment (optional)
                  </label>
                  <Textarea
                    id="reviewComment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Share your experience with ${sitterName}…`}
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                {reviewError && (
                  <p className="text-sm text-destructive">{reviewError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmittingReview || rating === 0}
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
