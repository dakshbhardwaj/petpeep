"use client"
// Needs "use client" — uses navigator.geolocation, file input state,
// Supabase Storage uploads, and the useBookingChat realtime hook.

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
import { Label } from "@/components/ui/label"
import {
  MapPin,
  Camera,
  CheckCircle,
  AlertCircle,
  Send,
  LogOut,
  Loader2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PENDING"

type Pet = {
  name: string
  species: string
}

type BookingDetail = {
  id: string
  status: BookingStatus
  date: string
  startTime: string
  endTime: string
  parent: {
    user: { name: string }
  }
  pets: Array<{ pet: Pet }>
}

type PhotoUpdate = {
  id: string
  photoUrl: string
  caption: string | null
  sentAt: string
}

type CheckInResult = {
  gpsVerified: boolean
  distanceMeters: number
}

type FeedingNotes = "ate_well" | "ate_less" | "did_not_eat" | "na"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    })
  )
}

// ─── Chat widget ─────────────────────────────────────────────────────────────

function ChatWidget({ bookingId, currentUserId }: { bookingId: string; currentUserId: string }) {
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
          <p className="text-center text-xs text-muted-foreground">No messages yet</p>
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
          placeholder="Type a message…"
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
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SitterVisitPage() {
  const { id: bookingId } = useParams<{ id: string }>()

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [photos, setPhotos] = useState<PhotoUpdate[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Check-in state
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check-out form state
  const [feedingNotes, setFeedingNotes] = useState<FeedingNotes>("na")
  const [behaviourNotes, setBehaviourNotes] = useState("")
  const [anyConcerns, setAnyConcerns] = useState("")
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkOutError, setCheckOutError] = useState<string | null>(null)
  const [visitComplete, setVisitComplete] = useState(false)

  // Load booking + current user on mount
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

  // ── Check-in ────────────────────────────────────────────────────────────────

  async function handleCheckIn() {
    setIsCheckingIn(true)
    setCheckInError(null)
    try {
      const position = await getCurrentPosition()
      const { latitude, longitude } = position.coords

      const res = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      })
      const data: { gpsVerified?: boolean; distanceMeters?: number; error?: string } =
        await res.json()

      if (!res.ok) {
        setCheckInError(data.error ?? "Check-in failed")
        return
      }

      setCheckInResult({
        gpsVerified: data.gpsVerified ?? false,
        distanceMeters: data.distanceMeters ?? 0,
      })

      // Refresh booking status
      setBooking((prev) => (prev ? { ...prev, status: "IN_PROGRESS" } : prev))
    } catch {
      setCheckInError("Could not get your location. Please enable GPS and try again.")
    } finally {
      setIsCheckingIn(false)
    }
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    setPhotoError(null)

    try {
      const supabase = createClient()
      const path = `${bookingId}/${Date.now()}.jpg`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, file, { contentType: file.type })

      if (uploadError || !uploadData) {
        setPhotoError("Upload failed. Please try again.")
        return
      }

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(uploadData.path)
      const photoUrl = urlData.publicUrl

      const res = await fetch(`/api/bookings/${bookingId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      })
      const result: { photo?: PhotoUpdate; error?: string } = await res.json()

      if (!res.ok) {
        setPhotoError(result.error ?? "Could not record photo")
        return
      }

      if (result.photo) {
        setPhotos((prev) => [...prev, result.photo!])
      }
    } catch {
      setPhotoError("Something went wrong uploading the photo.")
    } finally {
      setIsUploadingPhoto(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── Check-out ────────────────────────────────────────────────────────────────

  async function handleCheckOut() {
    setIsCheckingOut(true)
    setCheckOutError(null)
    try {
      const position = await getCurrentPosition()
      const { latitude, longitude } = position.coords

      const res = await fetch(`/api/bookings/${bookingId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude,
          longitude,
          feedingNotes,
          behaviourNotes: behaviourNotes || undefined,
          anyConcerns: anyConcerns || undefined,
        }),
      })
      const data: { booking?: { status: string }; error?: string } = await res.json()

      if (!res.ok) {
        setCheckOutError(data.error ?? "Check-out failed")
        return
      }

      setVisitComplete(true)
      setBooking((prev) => (prev ? { ...prev, status: "COMPLETED" } : prev))
    } catch {
      setCheckOutError("Could not get your location. Please enable GPS and try again.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

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
        <Link href="/sitter/bookings" className="mt-2 text-sm text-primary hover:underline">
          Back to bookings
        </Link>
      </div>
    )
  }

  const petNames = booking.pets.map((bp) => bp.pet.name).join(", ")
  const visitDate = new Date(booking.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* ── Header ── */}
      <div>
        <Link
          href="/sitter/bookings"
          className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← My bookings
        </Link>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-lg">{booking.parent.user.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {petNames} · {visitDate} · {booking.startTime}–{booking.endTime}
                </p>
              </div>
              <Badge
                variant={
                  booking.status === "IN_PROGRESS"
                    ? "success"
                    : booking.status === "CONFIRMED"
                      ? "default"
                      : "muted"
                }
              >
                {booking.status === "IN_PROGRESS"
                  ? "In progress"
                  : booking.status === "CONFIRMED"
                    ? "Confirmed"
                    : booking.status === "COMPLETED"
                      ? "Completed"
                      : booking.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Visit Complete ── */}
      {visitComplete && (
        <Card className="border-success bg-success-light">
          <CardContent className="p-4 flex flex-col items-center gap-3 text-center">
            <CheckCircle className="h-10 w-10 text-success" />
            <p className="font-semibold text-success text-lg">Visit complete!</p>
            <p className="text-sm text-muted-foreground">
              Thank you for taking great care of {petNames}.
            </p>
            <Link
              href={`/api/bookings/${bookingId}/reviews`}
              className="text-sm text-primary hover:underline"
            >
              Leave a review for {booking.parent.user.name}
            </Link>
            <Button asChild variant="outline" className="mt-1">
              <Link href="/sitter/bookings">Back to bookings</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Check-In Section ── */}
      {booking.status === "CONFIRMED" && !visitComplete && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Check In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tap the button below when you arrive at {booking.parent.user.name}&apos;s home.
              Your GPS location will be verified.
            </p>

            {checkInResult && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  checkInResult.gpsVerified
                    ? "bg-success-light text-success"
                    : "bg-warning-light text-warning"
                }`}
              >
                {checkInResult.gpsVerified ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {checkInResult.gpsVerified
                  ? `Location verified ✓ (${checkInResult.distanceMeters}m away)`
                  : `Location mismatch — proceeding anyway (${checkInResult.distanceMeters}m away)`}
              </div>
            )}

            {checkInError && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {checkInError}
              </p>
            )}

            <Button onClick={handleCheckIn} disabled={isCheckingIn} className="w-full">
              {isCheckingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting location…
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Check In
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Active Visit Section ── */}
      {booking.status === "IN_PROGRESS" && !visitComplete && (
        <>
          {/* Photo updates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-4 w-4 text-primary" />
                Photo Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Send at least one photo every 60 minutes during the visit.
              </p>

              {/* Existing photos */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={photo.photoUrl}
                        alt={photo.caption ?? "Visit photo"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 200px"
                      />
                    </div>
                  ))}
                </div>
              )}

              {photoError && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {photoError}
                </p>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Send Photo Update
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Chat */}
          {currentUserId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Chat with {booking.parent.user.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChatWidget bookingId={bookingId} currentUserId={currentUserId} />
              </CardContent>
            </Card>
          )}

          {/* Check-out form */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <LogOut className="h-4 w-4 text-primary" />
                Check Out
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="feedingNotes">Feeding update</Label>
                <select
                  id="feedingNotes"
                  value={feedingNotes}
                  onChange={(e) => setFeedingNotes(e.target.value as FeedingNotes)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ate_well">Ate well</option>
                  <option value="ate_less">Ate less than usual</option>
                  <option value="did_not_eat">Did not eat</option>
                  <option value="na">Not applicable</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="behaviourNotes">Behaviour notes (optional)</Label>
                <Textarea
                  id="behaviourNotes"
                  value={behaviourNotes}
                  onChange={(e) => setBehaviourNotes(e.target.value)}
                  placeholder="How was the pet's mood and energy today?"
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="anyConcerns">Any concerns? (optional)</Label>
                <Textarea
                  id="anyConcerns"
                  value={anyConcerns}
                  onChange={(e) => setAnyConcerns(e.target.value)}
                  placeholder="Anything the parent should know?"
                  rows={3}
                />
              </div>

              {checkOutError && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {checkOutError}
                </p>
              )}

              <Button
                onClick={handleCheckOut}
                disabled={isCheckingOut}
                className="w-full"
                variant="destructive"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking out…
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Check Out &amp; End Visit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Completed state (existing) ── */}
      {booking.status === "COMPLETED" && !visitComplete && (
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
            <p className="font-semibold">Visit completed</p>
            <Link
              href={`/sitter/bookings/${bookingId}/review`}
              className="mt-2 block text-sm text-primary hover:underline"
            >
              Leave a review for {booking.parent.user.name}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
