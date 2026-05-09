# 06 — Reusable Component Standards

Components are the building blocks of the UI. Inconsistent components lead to an inconsistent product. These standards ensure every component is predictable, accessible, and maintainable.

---

## Component Hierarchy

```
src/components/
├── ui/           ← shadcn/ui base components. NEVER modify these directly.
├── shared/       ← Used across all pages and user types
├── sitter/       ← Sitter-specific components
├── parent/       ← Parent-specific components
├── booking/      ← Booking flow components
├── chat/         ← Chat components
├── map/          ← Map and location components
└── admin/        ← Admin dashboard components
```

**Rule:** Before creating a new component, check if one already exists that can be extended. Duplication is the enemy.

---

## Component Template

Every component follows this exact structure:

```typescript
// src/components/sitter/SitterCard.tsx

// 1. "use client" directive (only if needed — explain why)
// "use client"
// Client component: uses hover state for shadow animation

// 2. Imports — external first, then internal
import { Star, MapPin, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { money } from "@/lib/money"
import type { SitterSearchResult } from "@/types/sitter"

// 3. Props type — always explicit, never `any`
type SitterCardProps = {
  sitter: SitterSearchResult
  onClick?: () => void
  className?: string   // Always accept className for flexibility
}

// 4. Named export (never default for components)
export function SitterCard({ sitter, onClick, className }: SitterCardProps) {
  // 5. Derived values — compute before render
  const hasReviews = sitter.totalReviews > 0
  const isNew = sitter.totalReviews < 3
  const displayRating = hasReviews ? sitter.avgRating.toFixed(1) : null
  const priceDisplay = money.format(sitter.hourlyRate1Hr)

  return (
    <article
      className={`
        bg-white rounded-card shadow-sm hover:shadow-md transition-shadow
        cursor-pointer border border-surface-high
        ${className ?? ""}
      `}
      onClick={onClick}
      aria-label={`${sitter.name}'s sitter profile`}
    >
      {/* Pet photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-card">
        <img
          src={sitter.profilePhoto ?? "/images/sitter-placeholder.jpg"}
          alt={`${sitter.name}'s profile photo`}
          className="w-full h-full object-cover"
        />
        <Badge
          variant="success"
          className="absolute top-3 right-3"
        >
          <Shield className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-on-surface">
            {sitter.name}
          </h3>
          <span className="font-semibold text-primary">
            {priceDisplay}/hr
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {sitter.distanceKm.toFixed(1)} km away
          </span>
          {hasReviews ? (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-secondary text-secondary" />
              {displayRating} · {sitter.totalReviews} reviews
            </span>
          ) : (
            <Badge variant="outline" className="text-xs">New Sitter</Badge>
          )}
        </div>
      </div>
    </article>
  )
}
```

---

## Required Props Patterns

### `className` prop — always optional, always pass-through

Every component that renders a root DOM element must accept `className`:

```typescript
type Props = {
  // ...other props
  className?: string
}

// In render:
<div className={`base-classes ${className ?? ""}`}>
```

This allows parent components to add spacing, width, or other layout concerns without needing to modify the component.

### Event handlers — `on` prefix, explicit types

```typescript
type Props = {
  onBook: (sitterId: string) => void
  onFavourite?: () => void  // Optional handlers use ?
}
```

### Loading and error states — always handle them

Every component that fetches data or performs async operations must handle:

```typescript
type Props = {
  isLoading?: boolean
  error?: string
}

// In component:
if (isLoading) return <SitterCardSkeleton />
if (error) return <ErrorMessage message={error} />
if (!sitter) return null
```

---

## Design System Usage

### Colours — use semantic tokens, not raw hex

```typescript
// ❌ Wrong — raw colour value
<div className="bg-[#005a71]">

// ✅ Right — semantic token from tailwind.config.ts
<div className="bg-primary">
<div className="bg-surface-container">
<div className="text-on-surface-variant">
```

### Typography — use font classes consistently

```typescript
// Headings → font-display (Quicksand)
<h1 className="font-display text-3xl font-semibold">Find a Sitter</h1>
<h2 className="font-display text-xl font-semibold">Reviews</h2>

// Body text → font-body (Inter, default)
<p className="text-base text-on-surface">Bruno is friendly and playful.</p>

// Labels, captions → smaller Inter
<span className="text-sm font-medium text-on-surface-variant">2.3 km away</span>
<span className="text-xs text-outline">5 minutes ago</span>
```

### Spacing — always use the 8px scale

```
p-1  = 4px (half base)
p-2  = 8px (base)
p-3  = 12px
p-4  = 16px
p-6  = 24px
p-8  = 32px
p-12 = 48px
p-16 = 64px
```

Never use arbitrary spacing values like `p-[13px]`. Round to the nearest 8px scale step.

### Border radius — use semantic values

```typescript
rounded-button  // 8px — for buttons
rounded-card    // 16px — for cards
rounded-full    // pill shape — for badges
rounded-lg      // 8px (Tailwind default) — for input fields
```

---

## Skeleton Loading Components

Every component that loads data needs a skeleton version:

```typescript
// src/components/sitter/SitterCardSkeleton.tsx
export function SitterCardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-surface-high animate-pulse">
      <div className="aspect-[4/3] bg-surface-container rounded-t-card" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 bg-surface-container rounded w-32" />
          <div className="h-5 bg-surface-container rounded w-16" />
        </div>
        <div className="h-4 bg-surface-container rounded w-24" />
      </div>
    </div>
  )
}
```

Naming: `[ComponentName]Skeleton` — always in the same file or as `[ComponentName].skeleton.tsx`.

---

## Empty State Components

Every list or search result needs an empty state:

```typescript
// src/components/shared/EmptyState.tsx
type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className ?? ""}`}>
      {icon && <div className="text-outline mb-4">{icon}</div>}
      <h3 className="font-display font-semibold text-on-surface mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-on-surface-variant max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-primary font-medium text-sm underline"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
```

---

## Accessibility Requirements

Every component must meet these accessibility standards:

1. **All images have `alt` text** — descriptive, not generic ("Priya's profile photo", not "image")
2. **All interactive elements are keyboard accessible** — test with Tab key
3. **Touch targets ≥44x44px** on mobile — never make a clickable element smaller
4. **Colour contrast ≥4.5:1** for normal text (Caring Teal on white passes this)
5. **Form fields have associated `<label>`** — never use placeholder as the only label
6. **Error messages are announced** to screen readers — use `role="alert"` on error states
7. **Loading states are announced** — use `aria-live="polite"` on dynamic content areas

```typescript
// ✅ Accessible button
<button
  onClick={handleBook}
  aria-label="Book Priya for dog sitting on June 20"
  className="..."
>
  Book Now
</button>

// ✅ Accessible form field
<div>
  <label htmlFor="pet-name" className="block text-sm font-medium mb-1">
    Pet Name
  </label>
  <input
    id="pet-name"
    type="text"
    aria-describedby="pet-name-hint"
    ...
  />
  <p id="pet-name-hint" className="text-xs text-outline mt-1">
    This is how sitters will refer to your pet
  </p>
</div>
```

---

## Mobile-First Responsive Rules

Build for 375px first, then add responsive variants:

```typescript
// ✅ Mobile-first approach
<div className="
  grid grid-cols-1 gap-4          // Mobile: single column
  sm:grid-cols-2                  // ≥640px: 2 columns
  lg:grid-cols-3                  // ≥1024px: 3 columns
">

// ✅ Bottom nav on mobile, sidebar on desktop
<nav className="
  fixed bottom-0 left-0 right-0 h-16 border-t   // Mobile: bottom bar
  lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:w-64 lg:border-r lg:border-t-0
">
```

**Breakpoints (Tailwind defaults):**
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

For PetPeep, the critical breakpoints are **375px** (mobile) and **1024px** (desktop). We rarely need `sm` and `md` breakpoints.
