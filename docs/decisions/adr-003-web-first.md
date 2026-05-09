# ADR-003 — Web First (Responsive Web App, No Native App for MVP)

**Date:** May 2026  
**Status:** Accepted  
**Deciders:** Product + Engineering

---

## Context

PetPeep's target users are mobile-first. Over 90% of Indian urban millennials will access the product on a smartphone. The natural assumption is to build a native Android app (given Android's >95% India market share). However, native app development significantly increases time to MVP.

---

## Decision

Build a **responsive web application** for v1. No native Android or iOS app in MVP. Mobile web experience is the primary mobile interface.

---

## Rationale

1. **Time to launch** — A native Android app adds 4–6 weeks of development (build pipeline, APK signing, Google Play submission, review time). A responsive web app ships to all devices the moment it's deployed to Vercel.

2. **No app store friction** — Google Play review takes 1–7 days. Web app can be updated and deployed in minutes. For a fast-moving MVP where we're iterating based on user feedback, this matters.

3. **Features work on web** — All P0 features work on a responsive web app:
   - GPS check-in: `navigator.geolocation` works in mobile Chrome/Safari
   - Push notifications: Web Push API works in Chrome on Android
   - Camera access: `<input type="file" accept="image/*" capture>` works on mobile browsers
   - Payments: Razorpay Checkout works on mobile web

4. **Cost** — No Google Play Developer account ($25 one-time, minor), but no app store optimisation overhead. Zero additional hosting cost.

5. **Validation first** — Build the native app only after proving users will pay for the product. A responsive web app is sufficient to validate the core hypothesis.

---

## Mobile Web Considerations

The web app must be genuinely mobile-friendly, not just "works on mobile":
- Minimum touch target size: 44x44px
- No horizontal scroll at 375px viewport width
- Fast load on 4G (LCP < 2.5s)
- Bottom navigation bar on mobile (not hamburger menu)
- Native-feeling interactions (smooth transitions, no flash of unstyled content)

---

## Consequences

- **Pro:** Ships 4–6 weeks earlier
- **Pro:** One codebase to maintain
- **Pro:** Instant updates without app store submission
- **Con:** Push notifications on iOS require Safari 16.4+ (acceptable — Indian urban users on recent iPhones)
- **Con:** No offline support (Service Worker offline caching not in scope for MVP)
- **Con:** GPS accuracy on mobile web is slightly lower than native app — acceptable given ±200m tolerance

## Migration Path

Once PMF is established:
1. Build native Android app using React Native (share most business logic with web)
2. Web app remains for desktop users and sitters (who may prefer desktop for dashboard)
3. iOS app follows after Android traction confirmed
