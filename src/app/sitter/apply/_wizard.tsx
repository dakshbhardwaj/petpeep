"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { QUIZ_QUESTIONS, PASS_MARK } from "@/lib/quiz"
import { Check, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { addDays } from "date-fns"

type WizardStep = "story" | "services" | "documents" | "quiz" | "submitted"

const CITIES = ["Mumbai", "Pune", "Navi Mumbai", "Thane"]
const RADIUS_OPTIONS = [1, 2, 5, 10, 15, 20]

interface Props {
  sitterId: string
  quizPassed: boolean
  quizScore: number | null
  quizLastAttempt: string | null
  existingCity: string
}

function StepIndicator({ step }: { step: WizardStep }) {
  const steps: { key: WizardStep; label: string }[] = [
    { key: "story", label: "Your story" },
    { key: "services", label: "Services" },
    { key: "documents", label: "ID docs" },
    { key: "quiz", label: "Quiz" },
  ]

  const currentIdx = steps.findIndex((s) => s.key === step)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  i < currentIdx
                    ? "bg-primary text-white"
                    : i === currentIdx
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentIdx ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1 transition-colors",
                  i < currentIdx ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SitterApplicationWizard({
  sitterId,
  quizPassed: initialQuizPassed,
  quizScore: initialQuizScore,
  quizLastAttempt,
  existingCity,
}: Props) {
  const router = useRouter()
  const supabaseRef = useRef<SupabaseClient | null>(null)
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }

  const [step, setStep] = useState<WizardStep>("story")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — Story
  const [bio, setBio] = useState("")
  const [experience, setExperience] = useState("")
  const [motivation, setMotivation] = useState("")
  const [homeEnvironment, setHomeEnvironment] = useState("")

  // Step 2 — Services
  const [city, setCity] = useState(existingCity || "")
  const [phone, setPhone] = useState("")
  const [acceptsDogs, setAcceptsDogs] = useState(true)
  const [acceptsCats, setAcceptsCats] = useState(true)
  const [acceptsOthers, setAcceptsOthers] = useState(false)
  const [serviceRadiusKm, setServiceRadiusKm] = useState(5)
  const [rate1Hr, setRate1Hr] = useState("")
  const [rate2Hr, setRate2Hr] = useState("")
  const [rate4Hr, setRate4Hr] = useState("")

  // Step 3 — Documents
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState<string | null>(null)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState("")

  // Step 4 — Quiz
  const [quizPassed, setQuizPassed] = useState(initialQuizPassed)
  const [quizScore, setQuizScore] = useState<number | null>(initialQuizScore)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizError, setQuizError] = useState<string | null>(null)
  const [retryAvailableAt, setRetryAvailableAt] = useState<string | null>(
    quizLastAttempt && !initialQuizPassed
      ? addDays(new Date(quizLastAttempt), 7).toISOString()
      : null
  )

  // ── Step 1: Validate & advance ──────────────────────────────────────────────
  function handleStoryNext(e: React.FormEvent) {
    e.preventDefault()
    if (bio.trim().length < 50) {
      setError("Bio must be at least 50 characters.")
      return
    }
    if (experience.trim().length < 30) {
      setError("Please describe your experience with pets (at least 30 characters).")
      return
    }
    setError(null)
    setStep("services")
  }

  // ── Step 2: Validate & advance ──────────────────────────────────────────────
  function handleServicesNext(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number.")
      return
    }
    if (!acceptsDogs && !acceptsCats && !acceptsOthers) {
      setError("Please select at least one pet type you can care for.")
      return
    }
    setError(null)
    setStep("documents")
  }

  // ── Step 3: Upload documents & advance ─────────────────────────────────────
  async function handleDocumentsNext(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setUploadProgress("")

    try {
      const supabase = getSupabase()

      // Upload Aadhaar
      if (aadhaarFile && !aadhaarDocUrl) {
        setUploadProgress("Uploading ID document…")
        const ext = aadhaarFile.name.split(".").pop()
        const path = `${sitterId}/aadhaar.${ext}`
        const { data, error: uploadError } = await supabase.storage
          .from("sitter-docs")
          .upload(path, aadhaarFile, { upsert: true })

        if (uploadError) {
          setError(`Failed to upload ID: ${uploadError.message}`)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("sitter-docs").getPublicUrl(data.path)
        setAadhaarDocUrl(publicUrl)
      }

      // Upload selfie
      if (selfieFile && !selfieUrl) {
        setUploadProgress("Uploading selfie…")
        const ext = selfieFile.name.split(".").pop()
        const path = `${sitterId}/selfie.${ext}`
        const { data, error: uploadError } = await supabase.storage
          .from("sitter-docs")
          .upload(path, selfieFile, { upsert: true })

        if (uploadError) {
          setError(`Failed to upload selfie: ${uploadError.message}`)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("sitter-docs").getPublicUrl(data.path)
        setSelfieUrl(publicUrl)
      }

      setUploadProgress("")
      setStep("quiz")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 4: Submit quiz ─────────────────────────────────────────────────────
  async function handleQuizSubmit(e: React.FormEvent) {
    e.preventDefault()
    setQuizError(null)

    // Check all answered
    if (Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length) {
      setQuizError("Please answer all questions before submitting.")
      return
    }

    setIsLoading(true)
    try {
      // Build ordered answer array
      const answers = QUIZ_QUESTIONS.map((q) => quizAnswers[q.id] ?? -1)

      const response = await fetch("/api/sitter/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const data = await response.json()

      if (response.status === 429) {
        setRetryAvailableAt(data.retryAvailableAt)
        setQuizError(
          `Quiz cooldown active. You can retry after ${new Date(data.retryAvailableAt).toLocaleDateString("en-IN")}.`
        )
        return
      }

      if (!response.ok) {
        setQuizError(data.error ?? "Failed to submit quiz. Please try again.")
        return
      }

      setQuizScore(data.score)
      setQuizPassed(data.passed)

      if (!data.passed) {
        setRetryAvailableAt(data.retryAvailableAt)
        setQuizError(
          `You scored ${data.score}% — you need ${PASS_MARK}% to pass. You can retry after 7 days.`
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Final submit: Create application ───────────────────────────────────────
  async function handleFinalSubmit() {
    if (!quizPassed) {
      setQuizError("Please pass the quiz first.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/sitter/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          experience,
          motivation: motivation || undefined,
          homeEnvironment: homeEnvironment || undefined,
          city,
          phone: phone.replace(/\D/g, ""),
          acceptsDogs,
          acceptsCats,
          acceptsOthers,
          serviceRadiusKm,
          rate1Hr: rate1Hr ? Math.round(parseFloat(rate1Hr) * 100) : undefined,
          rate2Hr: rate2Hr ? Math.round(parseFloat(rate2Hr) * 100) : undefined,
          rate4Hr: rate4Hr ? Math.round(parseFloat(rate4Hr) * 100) : undefined,
          aadhaarDocUrl: aadhaarDocUrl ?? undefined,
          selfieUrl: selfieUrl ?? undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Failed to submit. Please try again.")
        return
      }

      setStep("submitted")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Submitted ───────────────────────────────────────────────────────────────
  if (step === "submitted") {
    return (
      <div className="container py-12 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <span className="text-4xl">🐾</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Application submitted!</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you for applying. Our team will review your application within 3–5 business days.
            You&apos;ll receive an email with the result.
          </p>
          <button
            onClick={() => {
              router.push("/sitter/dashboard")
              router.refresh()
            }}
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-lg py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Sitter Application</h1>
        <p className="text-sm text-muted-foreground">Tell us about yourself to get started</p>
      </div>

      <StepIndicator step={step} />

      {/* ── Step 1: Your Story ─────────────────────────────────────────────── */}
      {step === "story" && (
        <form onSubmit={handleStoryNext} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="bio">Your bio</Label>
            <p className="text-xs text-muted-foreground">
              This appears on your public profile. At least 50 characters.
            </p>
            <Textarea
              id="bio"
              placeholder="Hi! I'm Priya, a lifelong animal lover based in Bandra. I've grown up with dogs and have been volunteering at a local shelter for 3 years…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              required
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">{bio.length} / 1000</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="experience">Pet care experience</Label>
            <Textarea
              id="experience"
              placeholder="I've cared for dogs, cats, and rabbits. My experience includes daily walks, feeding, administering medication, and handling anxious pets…"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motivation">Why do you want to be a sitter? (optional)</Label>
            <Textarea
              id="motivation"
              placeholder="I want to spend time with animals and help busy pet parents have peace of mind…"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="homeEnv">Your home environment (optional)</Label>
            <Textarea
              id="homeEnv"
              placeholder="I live in a 2BHK apartment on the 3rd floor. No other pets. Quiet building with a small garden nearby…"
              value={homeEnvironment}
              onChange={(e) => setHomeEnvironment(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full">
            Continue →
          </Button>
        </form>
      )}

      {/* ── Step 2: Services ──────────────────────────────────────────────── */}
      {step === "services" && (
        <form onSubmit={handleServicesNext} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">Your city</Label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
              >
                <option value="" disabled>
                  Select city
                </option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Pets accepted */}
          <div className="space-y-2">
            <Label>Pets I can care for</Label>
            {[
              { key: "dogs", label: "🐕 Dogs", value: acceptsDogs, setter: setAcceptsDogs },
              { key: "cats", label: "🐈 Cats", value: acceptsCats, setter: setAcceptsCats },
              {
                key: "others",
                label: "🐾 Other animals",
                value: acceptsOthers,
                setter: setAcceptsOthers,
              },
            ].map(({ key, label, value, setter }) => (
              <label key={key} className="flex cursor-pointer items-center gap-3">
                <div
                  onClick={() => setter(!value)}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                    value ? "border-primary bg-primary text-white" : "border-input bg-white"
                  )}
                >
                  {value && <Check className="h-3 w-3" />}
                </div>
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>

          {/* Service radius */}
          <div className="space-y-1.5">
            <Label>Service radius</Label>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setServiceRadiusKm(r)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    serviceRadiusKm === r
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* Rates */}
          <div className="space-y-3">
            <Label>Your rates (₹)</Label>
            <p className="text-xs text-muted-foreground">
              These are the amounts pet parents pay you directly via UPI.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "1-hour visit", value: rate1Hr, setter: setRate1Hr, key: "1hr" },
                { label: "2-hour visit", value: rate2Hr, setter: setRate2Hr, key: "2hr" },
                { label: "4-hour visit", value: rate4Hr, setter: setRate4Hr, key: "4hr" },
              ].map(({ label, value, setter, key }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={50}
                      placeholder="400"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep("story")}>
              ← Back
            </Button>
            <Button type="submit" className="flex-1">
              Continue →
            </Button>
          </div>
        </form>
      )}

      {/* ── Step 3: Documents ─────────────────────────────────────────────── */}
      {step === "documents" && (
        <form onSubmit={handleDocumentsNext} className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <p className="text-sm text-muted-foreground">
                ID documents are reviewed only by PetPeep admins for verification purposes.
                Documents are stored securely and never shared publicly.
              </p>
            </div>
          </div>

          {/* Aadhaar upload */}
          <div className="space-y-2">
            <Label>Aadhaar card photo</Label>
            <p className="text-xs text-muted-foreground">
              Upload a clear photo of your Aadhaar card (front). Max 5 MB.
            </p>
            {aadhaarDocUrl ? (
              <div className="flex items-center gap-2 rounded-xl border border-success bg-success/5 p-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm text-success">Aadhaar uploaded</span>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {aadhaarFile ? aadhaarFile.name : "Click to upload or drag & drop"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && file.size > 5 * 1024 * 1024) {
                      setError("File must be under 5 MB")
                    } else {
                      setAadhaarFile(file ?? null)
                      setError(null)
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Selfie upload */}
          <div className="space-y-2">
            <Label>Selfie photo</Label>
            <p className="text-xs text-muted-foreground">
              A clear selfie of your face. This helps us verify your identity.
            </p>
            {selfieUrl ? (
              <div className="flex items-center gap-2 rounded-xl border border-success bg-success/5 p-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm text-success">Selfie uploaded</span>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selfieFile ? selfieFile.name : "Click to upload your selfie"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && file.size > 5 * 1024 * 1024) {
                      setError("File must be under 5 MB")
                    } else {
                      setSelfieFile(file ?? null)
                      setError(null)
                    }
                  }}
                />
              </label>
            )}
          </div>

          {uploadProgress && (
            <p className="text-sm text-muted-foreground">{uploadProgress}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <p className="text-xs text-muted-foreground text-center">
            Documents are optional for now — you can submit your application without them.
          </p>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep("services")}>
              ← Back
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {aadhaarFile || selfieFile ? "Upload & continue →" : "Skip & continue →"}
            </Button>
          </div>
        </form>
      )}

      {/* ── Step 4: Quiz ──────────────────────────────────────────────────── */}
      {step === "quiz" && (
        <div className="space-y-6">
          {/* Already passed */}
          {quizPassed && (
            <div className="rounded-xl border border-success bg-success/5 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <div>
                  <p className="font-semibold text-success">Quiz passed! Score: {quizScore}%</p>
                  <p className="text-sm text-muted-foreground">
                    You can now submit your application.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Retry cooldown active */}
          {!quizPassed && retryAvailableAt && new Date() < new Date(retryAvailableAt) && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="font-medium text-destructive">Quiz cooldown active</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You scored {quizScore}% (need {PASS_MARK}%). Retry available from{" "}
                {new Date(retryAvailableAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                .
              </p>
            </div>
          )}

          {/* Quiz form (show if not passed and no active cooldown) */}
          {!quizPassed && !(retryAvailableAt && new Date() < new Date(retryAvailableAt)) && (
            <form onSubmit={handleQuizSubmit} className="space-y-8">
              <div>
                <p className="text-sm font-medium">
                  Pet Care Knowledge Quiz — {QUIZ_QUESTIONS.length} questions
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score {PASS_MARK}% or higher to pass. Take your time!
                </p>
              </div>

              {QUIZ_QUESTIONS.map((q, qi) => (
                <div key={q.id} className="space-y-3">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground">{qi + 1}. </span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option, oi) => (
                      <label
                        key={oi}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all",
                          quizAnswers[q.id] === oi
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <input
                          type="radio"
                          name={`q${q.id}`}
                          value={oi}
                          className="hidden"
                          onChange={() =>
                            setQuizAnswers((prev) => ({ ...prev, [q.id]: oi }))
                          }
                        />
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                            quizAnswers[q.id] === oi
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {quizAnswers[q.id] === oi && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {quizError && <p className="text-sm text-destructive">{quizError}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setStep("documents")}>
                  ← Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isLoading}
                  disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                >
                  Submit quiz ({Object.keys(quizAnswers).length}/{QUIZ_QUESTIONS.length} answered)
                </Button>
              </div>
            </form>
          )}

          {/* Submit application (only after quiz passed) */}
          {quizPassed && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
                <p>✅ Story and experience filled</p>
                <p>✅ Services configured</p>
                <p>✅ Quiz passed ({quizScore}%)</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full"
                isLoading={isLoading}
                onClick={handleFinalSubmit}
              >
                Submit application
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("documents")}
              >
                ← Back
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
