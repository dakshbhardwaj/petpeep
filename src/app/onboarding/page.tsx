"use client"
// Client component — multi-step wizard with form state

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Dog, Cat, Rabbit, PawPrint, MapPin, Check } from "lucide-react"

type Step = "location" | "pet"
type Species = "DOG" | "CAT" | "OTHER"

const CITIES = ["Mumbai", "Pune", "Navi Mumbai", "Thane"]

// Progress indicator
function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ["location", "pet"]
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-all",
              s === step
                ? "bg-primary w-6"
                : steps.indexOf(step) > i
                  ? "bg-primary"
                  : "bg-muted"
            )}
          />
        </div>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabaseRef = useRef<SupabaseClient | null>(null)
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }

  const [step, setStep] = useState<Step>("location")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Location
  const [city, setCity] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [pincode, setPincode] = useState("")

  // Step 2: Pet
  const [petName, setPetName] = useState("")
  const [species, setSpecies] = useState<Species>("DOG")
  const [breed, setBreed] = useState("")
  const [ageMonths, setAgeMonths] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [hasEverBitten, setHasEverBitten] = useState(false)
  const [reactiveToStrangers, setReactiveToStrangers] = useState(false)
  const [resourceGuarding, setResourceGuarding] = useState(false)
  const [fearTriggers, setFearTriggers] = useState("")
  const [behavioralNotes, setBehavioralNotes] = useState("")
  const [dietaryNotes, setDietaryNotes] = useState("")
  const [medicalNotes, setMedicalNotes] = useState("")
  const [vaccinationStatus, setVaccinationStatus] = useState(false)

  // ── Step 1: Save location ──────────────────────────────────────────────────
  async function handleSaveLocation(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/onboarding/parent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, addressLine1, pincode: pincode || undefined }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Failed to save. Please try again.")
        return
      }
      setStep("pet")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Save pet ───────────────────────────────────────────────────────
  async function handleSavePet(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/onboarding/pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: petName,
          species,
          breed: breed || undefined,
          ageMonths: ageMonths ? parseInt(ageMonths) : undefined,
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
          hasEverBitten,
          reactiveToStrangers,
          resourceGuarding,
          fearTriggers: fearTriggers || undefined,
          behavioralNotes: behavioralNotes || undefined,
          dietaryNotes: dietaryNotes || undefined,
          medicalNotes: medicalNotes || undefined,
          vaccinationStatus,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? "Failed to save pet. Please try again.")
        return
      }
      // Done! Go to dashboard
      router.push("/dashboard")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  // Suppress unused variable warning — supabase client is available for future use (photo uploads)
  void getSupabase

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <span className="font-display text-xl font-bold text-primary">PetPeep</span>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-16">
        <StepDots step={step} />

        {/* ── Step 1: Location ─────────────────────────────────────────────── */}
        {step === "location" && (
          <form onSubmit={handleSaveLocation} className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Where are you based?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We use this to match you with nearby sitters
              </p>
            </div>

            <div className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                >
                  <option value="" disabled>
                    Select your city
                  </option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Flat 4B, Shree Apartments, Bandra West"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="400050"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={!city || !addressLine1}>
              Continue
            </Button>
          </form>
        )}

        {/* ── Step 2: First Pet ─────────────────────────────────────────────── */}
        {step === "pet" && (
          <form onSubmit={handleSavePet} className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <PawPrint className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">Tell us about your pet</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This helps sitters prepare the perfect visit
              </p>
            </div>

            {/* Basic info */}
            <div className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Basic Info
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="petName">Pet&apos;s name</Label>
                <Input
                  id="petName"
                  type="text"
                  placeholder="Mango, Bruno, Luna…"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Species */}
              <div className="space-y-2">
                <Label>Species</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "DOG", label: "Dog", Icon: Dog },
                      { value: "CAT", label: "Cat", Icon: Cat },
                      { value: "OTHER", label: "Other", Icon: Rabbit },
                    ] as const
                  ).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSpecies(value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all",
                        species === value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                      aria-pressed={species === value}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="breed">Breed (optional)</Label>
                  <Input
                    id="breed"
                    type="text"
                    placeholder="Labrador"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="age">Age (months)</Label>
                  <Input
                    id="age"
                    type="number"
                    min={0}
                    max={360}
                    placeholder="24"
                    value={ageMonths}
                    onChange={(e) => setAgeMonths(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weight">Weight (kg, optional)</Label>
                <Input
                  id="weight"
                  type="number"
                  step={0.1}
                  min={0}
                  placeholder="12.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
            </div>

            {/* Behavioral profile — liability critical */}
            <div className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
              <div>
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Behaviour
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Required — helps sitters stay safe with your pet
                </p>
              </div>

              {/* Yes/No questions */}
              {[
                {
                  key: "hasEverBitten",
                  value: hasEverBitten,
                  setter: setHasEverBitten,
                  label: "Has your pet ever bitten anyone?",
                },
                {
                  key: "reactiveToStrangers",
                  value: reactiveToStrangers,
                  setter: setReactiveToStrangers,
                  label: "Is your pet reactive to strangers?",
                },
                {
                  key: "resourceGuarding",
                  value: resourceGuarding,
                  setter: setResourceGuarding,
                  label: "Does your pet resource-guard food or toys?",
                },
              ].map(({ key, value, setter, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="flex-1 pr-4 text-sm leading-snug">{label}</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setter(false)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        !value
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setter(true)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        value
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              ))}

              <div className="space-y-1.5">
                <Label htmlFor="fearTriggers">Fear triggers (optional)</Label>
                <Textarea
                  id="fearTriggers"
                  placeholder="Loud noises, vacuum cleaners, motorcycles…"
                  value={fearTriggers}
                  onChange={(e) => setFearTriggers(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="behavioralNotes">Additional behavioral notes (optional)</Label>
                <Textarea
                  id="behavioralNotes"
                  placeholder="Loves belly rubs, hates being picked up, needs time to warm up to new people…"
                  value={behavioralNotes}
                  onChange={(e) => setBehavioralNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Care notes */}
            <div className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Care Notes (optional)
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="dietaryNotes">Dietary notes</Label>
                <Textarea
                  id="dietaryNotes"
                  placeholder="Feeds twice a day at 8am and 7pm. No dairy. Allergic to chicken."
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="medicalNotes">Medical notes</Label>
                <Textarea
                  id="medicalNotes"
                  placeholder="On heart worm prevention. Vet: Dr. Sharma +91 98765 43210"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Vaccination */}
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  onClick={() => setVaccinationStatus(!vaccinationStatus)}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                    vaccinationStatus
                      ? "border-primary bg-primary text-white"
                      : "border-input bg-white"
                  )}
                >
                  {vaccinationStatus && <Check className="h-3 w-3" />}
                </div>
                <span className="text-sm">Vaccinations are up to date</span>
              </label>
            </div>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!petName}
            >
              Save and go to dashboard
            </Button>

            <button
              type="button"
              onClick={() => setStep("location")}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
