/**
 * Pet parent route group layout.
 * Wraps all /dashboard, /pets, /search, /bookings routes for parents.
 * Auth check is handled by middleware — this layout assumes authenticated PARENT.
 */
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Home, Search, Calendar, PawPrint, User } from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/search", label: "Find sitter", icon: Search },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/pets", label: "My pets", icon: PawPrint },
  { href: "/profile", label: "Profile", icon: User },
]

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  // Verify auth and role
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { userType: true, name: true },
  })

  if (!user) {
    redirect("/sign-up")
  }

  if (user.userType === "SITTER") {
    redirect("/sitter/dashboard")
  }

  if (user.userType === "ADMIN") {
    redirect("/admin/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-white px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-white">P</span>
          </div>
          <span className="font-display font-bold text-primary">PetPeep</span>
        </Link>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-border bg-white pb-safe">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
