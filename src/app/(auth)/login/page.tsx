"use client"
// Needs "use client" — manages form state and calls Supabase Auth

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type Step = "email" | "otp"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

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

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // Don't create a new user if they don't exist — login only
        shouldCreateUser: false,
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

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    })

    setIsLoading(false)

    if (error) {
      setError("Invalid or expired code. Please try again.")
      return
    }

    // Redirect to dashboard — middleware will handle role-based routing
    router.push("/dashboard")
    router.refresh()
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
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
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
