/**
 * Admin overview dashboard — Server Component.
 */
export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard",
}

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalSitters,
    pendingVetting,
    activeBookings,
    pendingPayouts,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.sitter.count({ where: { vettingStatus: "APPROVED" } }),
    prisma.sitter.count({ where: { vettingStatus: "PENDING" } }),
    prisma.booking.count({ where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] } } }),
    prisma.payout.count({ where: { status: "PENDING" } }),
  ])

  const METRICS = [
    { label: "Total users", value: totalUsers, color: "text-primary" },
    { label: "Active sitters", value: totalSitters, color: "text-success" },
    { label: "Pending vetting", value: pendingVetting, color: "text-warning" },
    { label: "Active bookings", value: activeBookings, color: "text-primary" },
    { label: "Pending payouts", value: pendingPayouts, color: "text-secondary" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform health at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {METRICS.map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`mt-1 text-3xl font-bold font-display ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
