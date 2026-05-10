"use client"
// Needs "use client" — manages form state and calls Supabase Auth

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
export default function AdminLoginPage() {
  const router = useRouter()

  const supabaseRef = useRef<SupabaseClient | null>(null)
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { data, error: authError } = await getSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (authError || !data.user) {
      setIsLoading(false)
      setError("Incorrect email or password.")
      return
    }

    // Verify the account is actually an ADMIN before granting access
    const res = await fetch("/api/auth/me")
    const me = await res.json()

    if (me?.user?.userType !== "ADMIN") {
      await getSupabase().auth.signOut()
      setIsLoading(false)
      setError("This account does not have admin access.")
      return
    }

    router.push("/admin/dashboard")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-low px-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <span className="text-sm font-bold text-white">P</span>
        </div>
        <span className="font-display text-xl font-bold text-primary">PetPeep Admin</span>
      </div>

      <Card className="w-full max-w-sm shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Admin sign in</CardTitle>
          <CardDescription>Internal access only</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@petpeep.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                error={error ?? undefined}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
