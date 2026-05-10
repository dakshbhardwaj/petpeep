/**
 * /sitters/[id] — Public sitter profile page.
 * Only visible for APPROVED sitters. Others get a 404.
 */
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { money } from "@/lib/money"
import type { Metadata } from "next"
import type { ElementType } from "react"
import { MapPin, ShieldCheck, Star, Dog, Cat, PawPrint } from "lucide-react"
import { BookingRequestForm } from "./_booking-request-form"

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const sitter = await prisma.sitter.findUnique({
    where: { id: params.id, vettingStatus: "APPROVED" },
    include: { user: { select: { name: true } } },
  })
  return {
    title: sitter ? `${sitter.user.name} — Pet Sitter on PetPeep` : "Sitter Not Found",
  }
}

export default async function SitterProfilePage({ params }: PageProps) {
  // Check auth state (non-blocking — unauthenticated users can still view profile)
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Fetch parent + pets if user is logged in as a PARENT
  let parentPets: { id: string; name: string; species: string }[] = []
  let isLoggedIn = false
  let isParent = false

  if (authUser) {
    isLoggedIn = true
    const parentRecord = await prisma.petParent.findUnique({
      where: { userId: authUser.id },
      include: {
        pets: {
          where: { isActive: true },
          select: { id: true, name: true, species: true },
          orderBy: { name: "asc" },
        },
      },
    })
    if (parentRecord) {
      isParent = true
      parentPets = parentRecord.pets.map((p) => ({
        id: p.id,
        name: p.name,
        species: p.species,
      }))
    }
  }

  const sitter = await prisma.sitter.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          profilePhoto: true,
          createdAt: true,
        },
      },
      // Only count public reviews (parent → sitter direction)
      bookings: {
        where: { status: "COMPLETED" },
        select: {
          reviews: {
            where: { direction: "PARENT_TO_SITTER", isPublic: true },
            include: {
              // We don't expose reviewerId personally — just the review
            },
          },
        },
        take: 50,
      },
    },
  })

  // 404 for non-approved sitters
  if (!sitter || sitter.vettingStatus !== "APPROVED") {
    notFound()
  }

  const { user } = sitter

  // Collect all public reviews across all bookings
  const reviews = sitter.bookings.flatMap((b) => b.reviews)
  const isNewSitter = reviews.length === 0
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  const services = [
    sitter.hourlyRate1Hr && {
      label: "1-hour drop-in",
      rate: sitter.hourlyRate1Hr,
      id: "1hr",
    },
    sitter.hourlyRate2Hr && {
      label: "2-hour drop-in",
      rate: sitter.hourlyRate2Hr,
      id: "2hr",
    },
    sitter.hourlyRate4Hr && {
      label: "4-hour drop-in",
      rate: sitter.hourlyRate4Hr,
      id: "4hr",
    },
  ].filter(Boolean) as { label: string; rate: number; id: string }[]

  const acceptedPets = [
    sitter.acceptsDogs && { icon: Dog, label: "Dogs" },
    sitter.acceptsCats && { icon: Cat, label: "Cats" },
    sitter.acceptsOthers && { icon: PawPrint, label: "Others" },
  ].filter(Boolean) as { icon: ElementType; label: string }[]

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-white px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-white">P</span>
          </div>
          <span className="font-display font-bold text-primary">PetPeep</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Profile hero */}
        <div className="mb-6 flex items-start gap-4">
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarImage src={user.profilePhoto ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold">{user.name}</h1>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {sitter.city}
                {sitter.serviceRadiusKm > 0 && ` · up to ${sitter.serviceRadiusKm} km`}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified &amp; Approved
              </Badge>

              {isNewSitter && (
                <Badge variant="default" className="bg-secondary text-secondary-foreground">
                  New Sitter — Verified &amp; Interviewed
                </Badge>
              )}

              {!isNewSitter && avgRating !== null && (
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {sitter.bio && (
          <Card className="mb-4">
            <CardContent className="p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                About
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{sitter.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Services & Rates */}
        {services.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Services &amp; Rates
              </h2>
              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span className="text-sm">{s.label}</span>
                    <span className="font-semibold">{money.format(s.rate)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Payment via UPI directly to the sitter before the visit
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pets accepted */}
        {acceptedPets.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Pets I care for
              </h2>
              <div className="flex gap-3">
                {acceptedPets.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 rounded-xl border border-border px-4 py-3"
                  >
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {sitter.experience && (
          <Card className="mb-4">
            <CardContent className="p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Experience
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{sitter.experience}</p>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <Card className="mb-4">
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Reviews
            </h2>

            {isNewSitter ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No reviews yet — {user.name.split(" ")[0]} is a newly approved sitter.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ✓ Verified by PetPeep team · Passed pet care knowledge quiz
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-secondary text-secondary"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking CTA */}
        {!isLoggedIn && (
          <div className="rounded-2xl bg-primary/5 p-5 text-center">
            <p className="font-semibold text-primary">Want to book {user.name.split(" ")[0]}?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to request a booking.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link href="/login">Sign in to book</Link>
            </Button>
          </div>
        )}

        {isLoggedIn && !isParent && (
          <div className="rounded-2xl bg-primary/5 p-5 text-center">
            <p className="font-semibold text-primary">Want to book {user.name.split(" ")[0]}?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your pet parent profile to request a booking.
            </p>
          </div>
        )}

        {isLoggedIn && isParent && services.length > 0 && (
          <BookingRequestForm
            sitterId={sitter.id}
            sitterFirstName={user.name.split(" ")[0]}
            services={services.map((s) => ({
              type: s.id === "1hr"
                ? "DROP_IN_1HR"
                : s.id === "2hr"
                  ? "DROP_IN_2HR"
                  : "DROP_IN_4HR",
              label: s.label,
              rate: s.rate,
            }))}
            pets={parentPets}
          />
        )}
      </div>
    </div>
  )
}
