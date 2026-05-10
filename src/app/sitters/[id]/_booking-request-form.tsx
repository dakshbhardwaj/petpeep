"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { money } from "@/lib/money"
import { cn } from "@/lib/utils"

type ServiceType = "DROP_IN_1HR" | "DROP_IN_2HR" | "DROP_IN_4HR"

interface ServiceOption {
  type: ServiceType
  label: string
  rate: number
}

interface PetOption {
  id: string
  name: string
  species: string
}

interface BookingRequestFormProps {
  sitterId: string
  sitterFirstName: string
  services: ServiceOption[]
  pets: PetOption[]
}

/** Time slots from 09:00 to 18:00 in 30-minute increments */
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = []
  for (let hour = 9; hour <= 18; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`)
    if (hour < 18) slots.push(`${String(hour).padStart(2, "0")}:30`)
  }
  return slots
})()

/** Format YYYY-MM-DD for the minimum date (tomorrow) */
function getTomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split("T")[0]
}

export function BookingRequestForm({
  sitterId,
  sitterFirstName,
  services,
  pets,
}: BookingRequestFormProps) {
  const router = useRouter()
  const [serviceType, setServiceType] = useState<ServiceType | null>(
    services.length > 0 ? services[0].type : null
  )
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedService = services.find((s) => s.type === serviceType)

  function togglePet(petId: string) {
    setSelectedPetIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!serviceType) {
      setError("Please select a service type.")
      return
    }
    if (!date) {
      setError("Please pick a date.")
      return
    }
    if (selectedPetIds.length === 0) {
      setError("Please select at least one pet.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sitterId,
          serviceType,
          date,
          startTime,
          petIds: selectedPetIds,
          notesToSitter: notes || undefined,
        }),
      })
      const data: { booking?: { id: string }; error?: string } = await res.json()
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Failed to create booking. Please try again."
        )
        return
      }
      if (data.booking?.id) {
        router.push(`/bookings/${data.booking.id}`)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h2 className="mb-4 font-display text-lg font-bold">
        Request a booking with {sitterFirstName}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service type */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Service</Label>
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => setServiceType(s.type)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all",
                  serviceType === s.type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <span className="text-sm font-medium">{s.label}</span>
                <span className="font-bold text-primary">{money.format(s.rate)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="bookingDate" className="text-sm font-semibold">
            Date
          </Label>
          <input
            id="bookingDate"
            type="date"
            min={getTomorrowDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {/* Start time */}
        <div className="space-y-1.5">
          <Label htmlFor="startTime" className="text-sm font-semibold">
            Start time
          </Label>
          <select
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        {/* Pet selection */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Your pet(s)</Label>
          {pets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t added any pets yet.{" "}
              <a href="/pets/add" className="text-primary underline underline-offset-2">
                Add a pet first
              </a>
            </p>
          ) : (
            <div className="space-y-2">
              {pets.map((pet) => {
                const isSelected = selectedPetIds.includes(pet.id)
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => togglePet(pet.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                        isSelected ? "border-primary bg-primary" : "border-input bg-white"
                      )}
                    >
                      {isSelected && (
                        <svg
                          viewBox="0 0 12 12"
                          className="h-3 w-3 fill-white"
                          aria-hidden="true"
                        >
                          <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pet.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{pet.species.toLowerCase()}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notesToSitter" className="text-sm font-semibold">
            Notes for {sitterFirstName} (optional)
          </Label>
          <Textarea
            id="notesToSitter"
            placeholder="Any special instructions, access codes, care reminders…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Total */}
        {selectedService && (
          <div className="rounded-xl bg-muted/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total to pay sitter via UPI</span>
              <span className="font-bold">{money.format(selectedService.rate)}</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading || pets.length === 0 || !serviceType}
        >
          Request booking
        </Button>
      </form>
    </div>
  )
}
