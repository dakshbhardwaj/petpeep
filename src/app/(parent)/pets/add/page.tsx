"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Dog, Cat, Rabbit, ArrowLeft, Check } from "lucide-react"

type Species = "DOG" | "CAT" | "OTHER"

export default function AddPetPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function handleSubmit(e: React.FormEvent) {
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
      router.push("/pets")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-lg py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="font-display text-2xl font-bold">Add a pet</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-card">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Basic Info
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="petName">Pet&apos;s name</Label>
            <Input
              id="petName"
              placeholder="Mango, Bruno, Luna…"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              required
              autoFocus
            />
          </div>

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
            <Label htmlFor="weight">Weight in kg (optional)</Label>
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

        {/* Behavioral profile */}
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-card">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Behaviour
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Required — helps sitters stay safe
            </p>
          </div>

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
                    !value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setter(true)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    value ? "bg-destructive text-white" : "bg-muted text-muted-foreground"
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
              placeholder="Loud noises, motorcycles…"
              value={fearTriggers}
              onChange={(e) => setFearTriggers(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="behavioralNotes">Additional behavioral notes (optional)</Label>
            <Textarea
              id="behavioralNotes"
              placeholder="Loves belly rubs, needs time to warm up…"
              value={behavioralNotes}
              onChange={(e) => setBehavioralNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Care notes */}
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-card">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Care Notes (optional)
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="dietaryNotes">Dietary notes</Label>
            <Textarea
              id="dietaryNotes"
              placeholder="Feeds twice a day. No dairy. Allergic to chicken."
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="medicalNotes">Medical notes & vet contact</Label>
            <Textarea
              id="medicalNotes"
              placeholder="On heart worm prevention. Vet: Dr. Sharma +91 98765 43210"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              rows={2}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => setVaccinationStatus(!vaccinationStatus)}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                vaccinationStatus ? "border-primary bg-primary text-white" : "border-input bg-white"
              )}
            >
              {vaccinationStatus && <Check className="h-3 w-3" />}
            </div>
            <span className="text-sm">Vaccinations are up to date</span>
          </label>
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" isLoading={isLoading} disabled={!petName}>
          Save pet
        </Button>
      </form>
    </div>
  )
}
