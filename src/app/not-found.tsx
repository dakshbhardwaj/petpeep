import Link from "next/link"
import { PawPrint, Home, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Page Not Found — PetPeep" }

async function getDashboardHref(): Promise<string> {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return "/"

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true },
    })

    if (dbUser?.userType === "ADMIN") return "/admin/dashboard"
    if (dbUser?.userType === "SITTER") return "/sitter/dashboard"
    if (dbUser?.userType === "PARENT") return "/dashboard"
  } catch {
    // If anything fails, fall back to home
  }
  return "/"
}

export default async function NotFound() {
  const dashboardHref = await getDashboardHref()
  const isLoggedIn = dashboardHref !== "/"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <span className="text-sm font-bold text-white">P</span>
        </div>
        <span className="font-display text-xl font-bold text-primary">PetPeep</span>
      </div>

      {/* Illustration */}
      <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-surface-container">
        <PawPrint className="h-14 w-14 text-primary/40" />
      </div>

      {/* Copy */}
      <h1 className="font-display text-3xl font-bold text-on-surface">Page not found</h1>
      <p className="mt-3 max-w-sm text-base text-muted-foreground">
        Looks like this page wandered off. The URL you followed doesn&apos;t exist or may have
        moved.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        {isLoggedIn ? (
          <>
            <Button asChild>
              <Link href={dashboardHref}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </>
        )}
      </div>

      {/* 404 label */}
      <p className="mt-12 text-xs text-muted-foreground">Error 404</p>
    </div>
  )
}
