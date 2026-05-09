/**
 * Admin route group layout.
 * Strictly ADMIN-only. Returns 403 for non-admins.
 */
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { LayoutDashboard, Users, ClipboardCheck, AlertTriangle } from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/vetting", label: "Vetting queue", icon: ClipboardCheck },
  { href: "/admin/bookings", label: "Bookings", icon: Users },
  { href: "/admin/sos", label: "SOS alerts", icon: AlertTriangle },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { userType: true, name: true },
  })

  if (!user || user.userType !== "ADMIN") {
    redirect("/dashboard") // Non-admins get redirected
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-56 flex-col border-r border-border bg-white md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <span className="text-xs font-bold text-white">P</span>
            </div>
            <span className="font-display font-bold text-primary">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-low hover:text-primary"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-medium">{user.name}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1 bg-surface-low p-6">{children}</main>
      </div>
    </div>
  )
}
