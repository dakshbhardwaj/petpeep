/**
 * Landing page — Server Component.
 * The public face of PetPeep. Mobile-first, Caring Teal design system.
 */
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Shield,
  MapPin,
  Camera,
  Star,
  Clock,
  CheckCircle2,
  ArrowRight,
  Dog,
  Cat,
  Heart,
} from "lucide-react"

// ─── Static data (no DB query needed for landing page) ────────────────────────

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Find a verified sitter",
    description:
      "Search sitters near you. Every sitter is Aadhaar-verified, background-checked, and quizzed on animal care.",
    icon: Shield,
  },
  {
    step: "02",
    title: "Book a drop-in visit",
    description:
      "Choose a 1hr, 2hr, or 4hr drop-in visit. The sitter comes to your home — your pet stays in their own environment.",
    icon: Clock,
  },
  {
    step: "03",
    title: "Track the visit live",
    description:
      "GPS-verified check-in, live photo updates every hour, and in-app chat with your sitter throughout the visit.",
    icon: Camera,
  },
]

const TRUST_FEATURES = [
  {
    icon: Shield,
    title: "Aadhaar-verified sitters",
    description: "Every sitter provides Aadhaar ID and passes a pet care quiz before joining.",
  },
  {
    icon: MapPin,
    title: "GPS check-in",
    description:
      "Sitters verify their location at check-in. You know your sitter arrived at your home.",
  },
  {
    icon: Camera,
    title: "Hourly photo updates",
    description:
      "Get photo updates every 60 minutes during the visit. See your pet is happy and safe.",
  },
  {
    icon: Star,
    title: "Verified reviews",
    description:
      "Every review is from a real booking. Fake reviews are impossible on our platform.",
  },
  {
    icon: Heart,
    title: "Zero booking fee",
    description:
      "Parents pay only the sitter's rate. No platform fee, no hidden charges. Transparent pricing.",
  },
  {
    icon: CheckCircle2,
    title: "≤25% acceptance rate",
    description:
      "We reject 3 in 4 sitter applicants. Being on PetPeep means something.",
  },
]

const SERVICES = [
  {
    duration: "1 hour",
    label: "Drop-in visit",
    description: "Quick check-in, feeding, playtime",
    ideal: "Busy workdays",
  },
  {
    duration: "2 hours",
    label: "Extended visit",
    description: "Walk, play, cuddle time",
    ideal: "Half-day events",
    popular: true,
  },
  {
    duration: "4 hours",
    label: "Half-day care",
    description: "Full care while you're out",
    ideal: "Travel, long meetings",
  },
]

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-surface-low to-background py-16 md:py-28">
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                🐾 Now live in Mumbai &amp; Pune
              </Badge>

              <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Your pet, always in{" "}
                <span className="text-primary">safe paws</span>
              </h1>

              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                Verified, Aadhaar-checked pet sitters come to your home.
                No kennels. No cages. Just home-like care with live updates.
              </p>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto">
                    Find a sitter near me
                    <ArrowRight className="ml-1" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    How it works
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>100% Aadhaar-verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Zero booking fee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Live GPS &amp; photo updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
            aria-hidden="true"
          />
        </section>

        {/* ── Pets we care for ────────────────────────────────────────────── */}
        <section className="border-y border-border bg-white py-10">
          <div className="container">
            <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                  <Dog className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">Dogs</p>
                  <p className="text-sm">All breeds welcome</p>
                </div>
              </div>
              <div className="hidden h-8 w-px bg-border md:block" aria-hidden="true" />
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                  <Cat className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">Cats</p>
                  <p className="text-sm">Including nervous &amp; senior</p>
                </div>
              </div>
              <div className="hidden h-8 w-px bg-border md:block" aria-hidden="true" />
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                  <span className="text-2xl">🐾</span>
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">Other pets</p>
                  <p className="text-sm">Birds, rabbits, small animals</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section id="how-it-works" className="section bg-background">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">How PetPeep works</h2>
              <p className="text-muted-foreground md:text-lg">
                Book a trusted sitter in under 5 minutes
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {HOW_IT_WORKS_STEPS.map(({ step, title, description, icon: Icon }) => (
                <div key={step} className="relative flex flex-col items-start gap-4">
                  {/* Step connector line (desktop) */}
                  <div className="flex w-full items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-display text-5xl font-bold text-primary/10">{step}</span>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href="/sign-up">
                <Button size="lg">
                  Get started — it&apos;s free
                  <ArrowRight className="ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Services / Pricing ──────────────────────────────────────────── */}
        <section className="section bg-surface-low">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">Drop-in visits</h2>
              <p className="text-muted-foreground md:text-lg">
                Your sitter comes to your home. Your pet stays comfortable in their own space.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {SERVICES.map(({ duration, label, description, ideal, popular }) => (
                <Card
                  key={duration}
                  className={`relative overflow-hidden transition-all hover:shadow-card-hover ${
                    popular ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {popular && (
                    <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </div>
                  )}
                  <CardContent className="p-6">
                    <p className="mb-1 text-3xl font-bold font-display text-primary">{duration}</p>
                    <p className="mb-2 font-semibold">{label}</p>
                    <p className="mb-4 text-sm text-muted-foreground">{description}</p>
                    <div className="rounded-lg bg-surface-container px-3 py-2 text-xs text-primary">
                      Ideal for: {ideal}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Sitters set their own rates. Zero platform fee for pet parents.
            </p>
          </div>
        </section>

        {/* ── Trust & Safety ──────────────────────────────────────────────── */}
        <section id="trust" className="section bg-background">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">Why parents trust PetPeep</h2>
              <p className="text-muted-foreground md:text-lg">
                We take safety seriously. So do our sitters.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TRUST_FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-xl border border-border bg-white p-5 transition-shadow hover:shadow-card"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sitter CTA ──────────────────────────────────────────────────── */}
        <section className="section bg-primary text-white">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Love pets? Earn doing what you love.
              </h2>
              <p className="mb-8 text-lg text-white/80">
                Join PetPeep as a verified sitter. Flexible hours, fair pay, and pet cuddles every day.
                ₹300–₹800 per visit depending on duration.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/sign-up?type=sitter">
                  <Button
                    size="lg"
                    className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto"
                  >
                    Apply as a sitter
                    <ArrowRight className="ml-1" />
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-white/60">
                One-time vetting fee of ₹299 · Takes 3–5 business days
              </p>
            </div>
          </div>
        </section>

        {/* ── Cities ──────────────────────────────────────────────────────── */}
        <section className="bg-surface-low py-12">
          <div className="container">
            <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-center md:gap-12">
              <div>
                <p className="font-display text-2xl font-bold text-primary">Mumbai</p>
                <p className="text-sm text-muted-foreground">
                  Bandra · Andheri · Powai · Dadar · Juhu
                </p>
              </div>
              <div className="hidden h-12 w-px bg-border md:block" aria-hidden="true" />
              <div>
                <p className="font-display text-2xl font-bold text-primary">Pune</p>
                <p className="text-sm text-muted-foreground">
                  Baner · Koregaon Park · Viman Nagar · Wakad · Kothrud
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
