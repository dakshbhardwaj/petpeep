/**
 * Pet parent dashboard — Server Component.
 * Shows upcoming bookings, quick actions, and pet summaries.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function ParentDashboardPage() {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      parent: {
        include: {
          pets: { where: { isActive: true }, take: 3 },
          bookings: {
            where: { status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
            orderBy: { date: "asc" },
            take: 3,
            include: {
              sitter: { include: { user: { select: { name: true, profilePhoto: true } } } },
            },
          },
        },
      },
    },
  })

  if (!user?.parent) redirect("/sign-up")

  const { parent } = user

  return (
    <div className="container py-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">
          Hi, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Your pet care dashboard</p>
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link href="/search">
          <Button className="w-full" size="lg">
            <Search className="mr-2 h-4 w-4" />
            Find a sitter
          </Button>
        </Link>
        <Link href="/pets/add">
          <Button variant="outline" className="w-full" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add pet
          </Button>
        </Link>
      </div>

      {/* Upcoming bookings */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display font-semibold">Upcoming visits</h2>
          <Link href="/bookings" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {parent.bookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No upcoming visits</p>
              <Link href="/search" className="mt-2 block text-sm text-primary hover:underline">
                Find a sitter
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {parent.bookings.map((booking) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card className="cursor-pointer hover:shadow-card-hover">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{booking.sitter.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {booking.startTime}
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
                          : "Pending"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* My pets */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display font-semibold">My pets</h2>
          <Link href="/pets" className="text-sm text-primary hover:underline">
            Manage
          </Link>
        </div>

        {parent.pets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Add your pet to get started</p>
              <Link href="/pets/add" className="mt-2 block text-sm text-primary hover:underline">
                Add first pet
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {parent.pets.map((pet) => (
              <Link key={pet.id} href={`/pets/${pet.id}`}>
                <Card className="cursor-pointer overflow-hidden hover:shadow-card-hover">
                  <CardContent className="p-3 text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container mx-auto">
                      <span className="text-2xl">
                        {pet.species === "DOG" ? "🐕" : pet.species === "CAT" ? "🐈" : "🐾"}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{pet.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {pet.breed ?? pet.species.toLowerCase()}
                    </p>
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
