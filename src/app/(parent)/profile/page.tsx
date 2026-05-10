/**
 * /profile — Parent profile page with account settings and logout.
 */
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/auth/logout-button"
import { MapPin, Mail, Phone } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "My Profile" }

export default async function ProfilePage() {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { parent: true },
  })

  if (!user?.parent) redirect("/sign-up")

  return (
    <div className="container max-w-lg py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">My profile</h1>
      </div>

      {/* Avatar + name */}
      <div className="mb-6 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xl font-bold">{user.name}</p>
          <p className="text-sm text-muted-foreground">Pet parent</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Account info */}
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <div className="flex items-center gap-3 p-4">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 p-4">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{user.phone}</p>
                </div>
              </div>
            )}
            {(user.parent.city || user.parent.addressLine1) && (
              <div className="flex items-center gap-3 p-4">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">
                    {user.parent.addressLine1
                      ? `${user.parent.addressLine1}, ${user.parent.city}`
                      : user.parent.city}
                    {user.parent.pincode && ` — ${user.parent.pincode}`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* App info */}
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <div className="p-4">
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <LogoutButton />
      </div>
    </div>
  )
}
