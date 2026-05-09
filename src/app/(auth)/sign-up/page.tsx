"use client"
// Needs "use client" — manages multi-step form state

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Dog, Briefcase } from "lucide-react"

type Step = "email" | "otp" | "profile"
type UserType = "PARENT" | "SITTER"

// useSearchParams() must be in a component wrapped in Suspense
// See: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  )
}

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Pre-select user type from URL param: /sign-up?type=sitter
  const initialType = searchParams.get("type") === "sitter" ? "SITTER" : null

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [name, setName] = useState("")
  const [userType, setUserType] = useState<UserType | null>(initialType)
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
        shouldCreateUser: true,
      },
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
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

    setStep("profile")
  }

  // Step 3 — Create user profile
  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userType) {
      setError("Please select whether you're a pet parent or sitter.")
      return
    }
    setError(null)
    setIsLoading(true)

    const response = await fetch("/api/auth/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), userType }),
    })

    const data = await response.json()

    setIsLoading(false)

    if (!response.ok) {
      setError(data.error ?? "Failed to create profile. Please try again.")
      return
    }

    // Redirect based on role
    if (userType === "SITTER") {
      router.push("/apply")
    } else {
      router.push("/onboarding")
    }
    router.refresh()
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">
          {step === "email" && "Create your account"}
          {step === "otp" && "Check your email"}
          {step === "profile" && "Tell us about yourself"}
        </CardTitle>
        <CardDescription>
          {step === "email" && "Sign up with your email — no password needed"}
          {step === "otp" && `Enter the 6-digit code we sent to ${email}`}
          {step === "profile" && "Just a few more details to get started"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* ── Step 1: Email ── */}
        {step === "email" && (
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
              Continue with email
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === "otp" && (
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
              Verify code
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

        {/* ── Step 3: Profile ── */}
        {step === "profile" && (
          <form onSubmit={handleCreateProfile} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Priya Shah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>I am a…</Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Pet Parent card */}
                <button
                  type="button"
                  onClick={() => setUserType("PARENT")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                    userType === "PARENT"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                  aria-pressed={userType === "PARENT"}
                >
                  <Dog className="h-8 w-8" />
                  <div>
                    <p className="text-sm font-semibold">Pet parent</p>
                    <p className="text-xs">I need a sitter</p>
                  </div>
                </button>

                {/* Sitter card */}
                <button
                  type="button"
                  onClick={() => setUserType("SITTER")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                    userType === "SITTER"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                  aria-pressed={userType === "SITTER"}
                >
                  <Briefcase className="h-8 w-8" />
                  <div>
                    <p className="text-sm font-semibold">Pet sitter</p>
                    <p className="text-xs">I want to earn</p>
                  </div>
                </button>
              </div>
              {error && !name && <p className="text-xs text-destructive">{error}</p>}
            </div>

            {error && name && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!name || !userType}
            >
              Create account
            </Button>
          </form>
        )}

        {step !== "profile" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
