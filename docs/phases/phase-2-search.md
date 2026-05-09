# Phase 2 — Search & Discovery

**Timeline:** Weeks 6–7  
**Goal:** A pet parent can search for sitters, filter results, and view full sitter profiles. The search experience is fast, location-aware, and mobile-responsive.

---

## What Gets Built

- Location-based sitter search with radius filter
- Filter panel (availability, price, pet type, rating, verified badge)
- Sitter result cards (photo, name, distance, rating, price)
- Full sitter profile page with availability calendar
- Map view showing sitter locations (Leaflet + OpenStreetMap)

---

## User Flow

```
Parent dashboard → "Find a Sitter"
→ Search page loads:
   - Default location: parent's saved address
   - Default radius: 5km
   - Default date: tomorrow
→ Results: sitter cards ordered by distance
→ Apply filters (availability, price, pet type, rating)
→ Click sitter card → Sitter profile page
→ "Request a Booking" CTA (links to booking flow — Phase 3)
```

---

## Detailed Task Breakdown

### 1. Search API

**Route:** `GET /api/sitters/search`

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| lat | float | parent's lat | Center of search |
| lng | float | parent's lng | Center of search |
| radius | int | 5 | Radius in km |
| date | string | tomorrow | Required date (YYYY-MM-DD) |
| petType | string | any | dog / cat / other |
| minPrice | int | 0 | Minimum hourly rate (INR) |
| maxPrice | int | 9999 | Maximum hourly rate (INR) |
| minRating | float | 0 | Minimum average rating |
| verifiedOnly | bool | false | Only show verified sitters |
| page | int | 1 | Pagination |
| limit | int | 20 | Results per page |

**Implementation:**

```typescript
// src/app/api/sitters/search/route.ts
// Uses PostGIS ST_DWithin for radius search

const sitters = await prisma.$queryRaw`
  SELECT s.*, u.name, u.profilePhoto,
    ST_Distance(
      ST_Point(s.longitude, s.latitude)::geography,
      ST_Point(${lng}, ${lat})::geography
    ) / 1000 AS distance_km
  FROM "Sitter" s
  JOIN "User" u ON u.id = s."userId"
  WHERE s."vettingStatus" = 'APPROVED'
    AND s."isActive" = true
    AND ST_DWithin(
      ST_Point(s.longitude, s.latitude)::geography,
      ST_Point(${lng}, ${lat})::geography,
      ${radius * 1000}
    )
    AND s."acceptsDogs" = ${petType === 'dog' ? true : s.acceptsDogs}
    -- (additional filters applied similarly)
  ORDER BY distance_km ASC
  LIMIT ${limit} OFFSET ${(page - 1) * limit}
`;
```

**Acceptance criteria:**
- Given a search with radius 3km, when results return, then only sitters within 3km are shown
- Given a sitter has no availability set for the selected date, when search runs, then they do not appear in results
- Given a parent filters by "Dogs only", when results load, then sitters with `acceptsDogs = false` are excluded
- Given no sitters exist in the search area, when results load, then an empty state with "Try increasing your radius" is shown

---

### 2. Sitter Result Cards

**Component:** `SitterCard`

**Displays:**
- Profile photo (4:3 ratio, `rounded-card`)
- "Verified" badge (top-right, green pill)
- Name and distance (e.g., "Priya S. · 2.3 km away")
- Star rating + review count (e.g., ★ 4.8 · 12 reviews)
- Pets accepted icons (dog 🐕 / cat 🐱)
- Starting price (e.g., "From ₹400/hr")
- "New Sitter" badge if fewer than 3 reviews

**Interaction:**
- Hover: shadow increases (desktop)
- Click: navigates to `/sitters/[id]`

---

### 3. Filter Panel

**Filters (collapsible on mobile, sidebar on desktop):**

| Filter | Type | Options |
|---|---|---|
| Date | Date picker | Any future date |
| Radius | Slider | 1–15 km |
| Pet type | Multi-select | Dog / Cat / Other |
| Price range | Dual slider | ₹100 – ₹2000 |
| Minimum rating | Star select | 3★ / 4★ / 4.5★ |
| Verified only | Toggle | On / Off |

**Acceptance criteria:**
- Filters update results without full page reload (client-side filter state + API call)
- Active filters are visually indicated (badge count on "Filters" button on mobile)
- "Clear all filters" resets to defaults

---

### 4. Map View

**Uses:** Leaflet.js + OpenStreetMap (free, no API key)

**Features:**
- Map centered on parent's location (blue pin)
- Sitter location pins (teal, with photo thumbnail on click)
- Clicking a pin shows a mini card with name, rating, price
- Toggle between "List" and "Map" view on mobile

**Implementation:**
```typescript
// Only load Leaflet client-side (Next.js SSR incompatible)
const MapView = dynamic(() => import("@/components/search/MapView"), {
  ssr: false,
  loading: () => <div className="h-96 bg-surface-low animate-pulse rounded-card" />,
});
```

**Acceptance criteria:**
- Map loads without errors on all browsers
- Sitter pins show only approved, active sitters within the search radius
- Map does not cause performance issues on mobile (lazy loaded)

---

### 5. Sitter Profile Page (Full Version)

**Route:** `/sitters/[id]`

**Sections:**

1. **Header:** Photo, name, city, "Verified" badge, response rate, joined date
2. **About:** Bio, experience description, home environment
3. **Services & Pricing:**
   - Drop-in 1hr: ₹XXX
   - Drop-in 2hr: ₹XXX
   - Extended sit 4hr: ₹XXX
4. **Pets Accepted:** Dog / Cat / Other (with visual icons)
5. **Availability Calendar:** Read-only monthly view, unavailable dates greyed out
6. **Reviews:** Sorted by newest, showing star rating + comment + date + pet parent first name
   - Empty state: "New Sitter – Verified & Interviewed" callout card
7. **Service Area:** Small Leaflet map showing approximate area (not exact address)
8. **Request Booking CTA:** Sticky button at bottom (mobile) / sidebar (desktop) → links to booking flow (Phase 3)

**Acceptance criteria:**
- Page is server-rendered (for SEO) with sitter data fetched server-side
- Given a sitter profile with 5 reviews, when the page loads, then all reviews are visible with ratings
- Given a date is marked unavailable in SitterAvailability, when the calendar renders, then that date is greyed out

---

## Deliverables

| Deliverable | Done When |
|---|---|
| Search returns correct results | Location + filters working, tested with seed data |
| Map view renders | Sitter pins visible on OpenStreetMap |
| Sitter profile page complete | All sections render with real data |
| Mobile responsive | Search + filters + cards work on 375px screen |
| Performance acceptable | Search results render in <1.5s |

---

## Seed Data Needed

Before testing Phase 2, create 10–15 test sitter accounts across Mumbai and Pune:
- 5 in South Mumbai (18.9–19.0°N, 72.8–72.9°E)
- 5 in Bandra/Andheri (19.0–19.1°N, 72.8–72.9°E)
- 3 in Pune (18.5°N, 73.8°E)
- Mix of ratings (4.2–5.0), prices (₹300–₹900), and pet types

Create a Prisma seed script at `prisma/seed.ts`.
