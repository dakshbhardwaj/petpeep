"use client"
// Needs "use client" — manages form state and calls Supabase Auth

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type Step = "email" | "otp"

export default function LoginPage() {
  const router = useRouter()
  // Lazy-init the Supabase client so it doesn't run at build/SSR time
  // (createBrowserClient requires NEXT_PUBLIC_ vars which aren't set during build)
  const supabaseRef = useRef<SupabaseClient | null>(null)
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false, // Login only — don't create new users here
      },
    })

    setIsLoading(false)

    if (error) {
      if (error.message.includes("Signups not allowed") || error.message.includes("not found")) {
        setError("No account found with this email. Sign up first.")
      } else {
        setError(error.message)
      }
      return
    }

    setStep("otp")
  }

  // Step 2 — Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await getSupabase().auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    })

    if (error) {
      setIsLoading(false)
      setError("Invalid or expired code. Please try again.")
      return
    }

    // Check user role and redirect to the right dashboard
    try {
      const res = await fetch("/api/auth/me")
      const data = await res.json()
      const userType = data?.user?.userType

      if (userType === "SITTER") {
        router.push("/sitter/dashboard")
      } else if (userType === "ADMIN") {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    } catch {
      // Fallback: dashboard layout handles the redirect
      router.push("/dashboard")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          {step === "email"
            ? "Enter your email to receive a one-time login code"
            : `Enter the 6-digit code sent to ${email}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                error={error ?? undefined}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send login code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp">One-time code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6,8}"
                maxLength={8}
                placeholder="06832475"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                required
                autoComplete="one-time-code"
                autoFocus
                error={error ?? undefined}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Log in
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setStep("email")
                setOtp("")
                setError(null)
              }}
            >
              Use a different email
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
