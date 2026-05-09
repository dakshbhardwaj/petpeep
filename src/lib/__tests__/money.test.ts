/**
 * Unit tests for src/lib/money.ts
 *
 * 100% coverage required — money handling is financial-critical.
 * No mocks needed — pure functions with no external dependencies.
 */
import { describe, it, expect } from "vitest"
import {
  toPaise,
  toRupees,
  format,
  commission,
  sitterEarnings,
  refund,
  getCancellationPolicy,
} from "@/lib/money"

describe("toPaise", () => {
  it("converts whole rupees to paise", () => {
    expect(toPaise(500)).toBe(50000)
    expect(toPaise(1)).toBe(100)
    expect(toPaise(0)).toBe(0)
  })

  it("rounds floating point rupees correctly", () => {
    expect(toPaise(0.1)).toBe(10)
    expect(toPaise(99.99)).toBe(9999)
  })
})

describe("toRupees", () => {
  it("converts paise to rupees", () => {
    expect(toRupees(50000)).toBe(500)
    expect(toRupees(100)).toBe(1)
    expect(toRupees(0)).toBe(0)
  })
})

describe("format", () => {
  it("formats whole rupee amounts", () => {
    expect(format(50000)).toBe("₹500")
    expect(format(100)).toBe("₹1")
    expect(format(0)).toBe("₹0")
  })

  it("formats large amounts with Indian number formatting", () => {
    expect(format(100000)).toBe("₹1,000")
    expect(format(10000000)).toBe("₹1,00,000")
  })

  it("formats amounts with paise", () => {
    expect(format(50050)).toBe("₹500.50")
    expect(format(50001)).toBe("₹500.01")
  })
})

describe("commission", () => {
  it("calculates 15% platform commission", () => {
    expect(commission(50000)).toBe(7500) // ₹500 → ₹75
    expect(commission(100000)).toBe(15000) // ₹1000 → ₹150
    expect(commission(0)).toBe(0)
  })

  it("rounds down (never over-charges)", () => {
    // 15% of 10001 paise = 1500.15 → rounds down to 1500
    expect(commission(10001)).toBe(1500)
  })

  it("commission + sitterEarnings = totalAmount", () => {
    const total = 50000
    expect(commission(total) + sitterEarnings(total)).toBe(total)
  })
})

describe("sitterEarnings", () => {
  it("calculates 85% sitter earnings", () => {
    expect(sitterEarnings(50000)).toBe(42500) // ₹500 → ₹425
    expect(sitterEarnings(100000)).toBe(85000) // ₹1000 → ₹850
  })
})

describe("refund", () => {
  it("returns full amount for FULL_REFUND", () => {
    expect(refund(50000, "FULL_REFUND")).toBe(50000)
  })

  it("returns 50% for PARTIAL_REFUND", () => {
    expect(refund(50000, "PARTIAL_REFUND")).toBe(25000)
    expect(refund(50001, "PARTIAL_REFUND")).toBe(25000) // floors odd amounts
  })

  it("returns 0 for NO_REFUND", () => {
    expect(refund(50000, "NO_REFUND")).toBe(0)
  })
})

describe("getCancellationPolicy", () => {
  // Full refund: more than 24 hours before visit
  it("returns FULL_REFUND when >24hrs before visit", () => {
    expect(getCancellationPolicy(25)).toBe("FULL_REFUND")
    expect(getCancellationPolicy(48)).toBe("FULL_REFUND")
    expect(getCancellationPolicy(100)).toBe("FULL_REFUND")
  })

  // Boundary: exactly 24hrs is NOT full refund (must be >24)
  it("returns PARTIAL_REFUND at exactly 24hrs", () => {
    expect(getCancellationPolicy(24)).toBe("PARTIAL_REFUND")
  })

  // Partial refund: 6–24 hours before visit
  it("returns PARTIAL_REFUND for 6–24hrs", () => {
    expect(getCancellationPolicy(23)).toBe("PARTIAL_REFUND")
    expect(getCancellationPolicy(12)).toBe("PARTIAL_REFUND")
    expect(getCancellationPolicy(6)).toBe("PARTIAL_REFUND")
  })

  // No refund: less than 6 hours before visit
  it("returns NO_REFUND at exactly 5hrs", () => {
    expect(getCancellationPolicy(5)).toBe("NO_REFUND")
  })

  it("returns NO_REFUND for <6hrs", () => {
    expect(getCancellationPolicy(4)).toBe("NO_REFUND")
    expect(getCancellationPolicy(1)).toBe("NO_REFUND")
    expect(getCancellationPolicy(0)).toBe("NO_REFUND")
  })
})
