/**
 * Money utilities for PetPeep.
 *
 * RULE: All monetary amounts are stored in paise (integer).
 * 1 INR = 100 paise. Display only converts to rupees.
 *
 * Never do raw arithmetic on monetary amounts outside this module.
 * Use these helpers everywhere.
 */

const PLATFORM_COMMISSION_RATE = 0.15 // 15%

/**
 * Convert rupees (user input) to paise for storage.
 * @example money.toPaise(500) → 50000
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees for display.
 * @example money.toRupees(50000) → 500
 */
export function toRupees(paise: number): number {
  return paise / 100
}

/**
 * Format paise as a display string (₹500).
 * @example money.format(50000) → "₹500"
 * @example money.format(50050) → "₹500.50"
 */
export function format(paise: number): string {
  const rupees = paise / 100
  // Show decimals only if non-zero
  if (rupees % 1 === 0) {
    return `₹${rupees.toLocaleString("en-IN")}`
  }
  return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Calculate platform commission (15%) in paise.
 * Always rounds down — better to under-charge than over-charge.
 * @example money.commission(50000) → 7500
 */
export function commission(totalPaise: number): number {
  return Math.floor(totalPaise * PLATFORM_COMMISSION_RATE)
}

/**
 * Calculate sitter earnings after commission, in paise.
 * @example money.sitterEarnings(50000) → 42500
 */
export function sitterEarnings(totalPaise: number): number {
  return totalPaise - commission(totalPaise)
}

/**
 * Calculate refund amount based on cancellation policy.
 * @example money.refund(50000, "FULL_REFUND") → 50000
 * @example money.refund(50000, "PARTIAL_REFUND") → 25000
 * @example money.refund(50000, "NO_REFUND") → 0
 */
export function refund(
  totalPaise: number,
  policy: "FULL_REFUND" | "PARTIAL_REFUND" | "NO_REFUND"
): number {
  switch (policy) {
    case "FULL_REFUND":
      return totalPaise
    case "PARTIAL_REFUND":
      return Math.floor(totalPaise / 2)
    case "NO_REFUND":
      return 0
  }
}

/**
 * Determine cancellation policy based on hours until visit start.
 */
export function getCancellationPolicy(
  hoursUntilVisit: number
): "FULL_REFUND" | "PARTIAL_REFUND" | "NO_REFUND" {
  if (hoursUntilVisit > 24) return "FULL_REFUND"
  if (hoursUntilVisit >= 6) return "PARTIAL_REFUND"
  return "NO_REFUND"
}

// Named exports as a namespace-like object for convenient imports
export const money = {
  toPaise,
  toRupees,
  format,
  commission,
  sitterEarnings,
  refund,
  getCancellationPolicy,
}
