/**
 * Admin overview dashboard — Server Component.
 * Displays real-time platform metrics computed via Prisma.
 * Admin auth is enforced by the parent layout.tsx.
 */
export const dynamic = "force-dynamic"

import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { money } from "@/lib/money"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  PawPrint,
  ClipboardCheck,
  ShieldAlert,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatBookingDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  DISPUTED: { label: "Disputed", variant: "destructive" },
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  href?: string
  highlight?: "orange" | "red"
}

function StatCard({ label, value, icon, href, highlight }: StatCardProps) {
  const highlightClass =
    highlight === "red"
      ? "border-destructive/40 bg-destructive/5"
      : highlight === "orange"
      ? "border-warning/40 bg-warning/5"
      : ""

  const valueClass =
    highlight === "red"
      ? "text-destructive"
      : highlight === "orange"
      ? "text-warning"
      : "text-primary"

  const card = (
    <Card className={`${highlightClass} transition-shadow hover:shadow-sm`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className={`mt-2 font-display text-3xl font-bold ${valueClass}`}>
          {value}
        </p>
        {href && (
          <p className="mt-1 text-xs text-primary underline-offset-2 hover:underline">
            View &rarr;
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }
  return card
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const [
    totalBookings,
    activeBookings,
    completedBookings,
    cancelledBookings,
    totalParents,
    totalSitters,
    pendingApplications,
    openSOS,
    recentBookings,
    totalRevenue,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
    }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.petParent.count(),
    prisma.sitter.count({ where: { vettingStatus: "APPROVED" } }),
    prisma.sitter.count({ where: { vettingStatus: "PENDING" } }),
    prisma.sOSAlert.count({ where: { resolvedAt: null } }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        parent: { include: { user: { select: { name: true } } } },
        sitter: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.booking.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalAmount: true },
    }),
  ])

  const gmv = totalRevenue._sum.totalAmount ?? 0
  const today = new Date()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
      </div>

      {/* Metrics grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Total bookings"
          value={totalBookings}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          label="Active bookings"
          value={activeBookings}
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Completed bookings"
          value={completedBookings}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Cancelled bookings"
          value={cancelledBookings}
          icon={<XCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Total parents"
          value={totalParents}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Approved sitters"
          value={totalSitters}
          icon={<PawPrint className="h-5 w-5" />}
        />
        <StatCard
          label="Pending applications"
          value={pendingApplications}
          icon={<AlertTriangle className="h-5 w-5" />}
          href="/admin/vetting"
          highlight={pendingApplications > 0 ? "orange" : undefined}
        />
        <StatCard
          label="Open SOS alerts"
          value={openSOS}
          icon={<ShieldAlert className="h-5 w-5" />}
          href="/admin/sos"
          highlight={openSOS > 0 ? "red" : undefined}
        />
        <StatCard
          label="Total GMV"
          value={money.format(gmv)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Recent bookings */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">
          Recent Bookings
        </h2>

        {recentBookings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No bookings yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentBookings.map((booking) => {
                  const statusInfo =
                    STATUS_BADGE[booking.status] ?? STATUS_BADGE["PENDING"]

                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {booking.parent.user.name}{" "}
                          <span className="font-normal text-muted-foreground">
                            &rarr;
                          </span>{" "}
                          {booking.sitter.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBookingDate(booking.date)} &middot;{" "}
                          {booking.startTime}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs text-muted-foreground sm:block font-mono">
                          {money.format(booking.totalAmount)}
                        </span>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
