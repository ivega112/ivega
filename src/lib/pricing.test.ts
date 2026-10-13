import { describe, expect, it } from "vitest";
import { calculateDiscountPercent, calculateSubtotal, calculateOrderTotals, formatCurrency, clampQuantity, toMoney } from "./pricing";

describe("calculateDiscountPercent", () => {
  it("returns null when there is no old price", () => {
    expect(calculateDiscountPercent(10, null)).toBeNull();
    expect(calculateDiscountPercent(10, undefined)).toBeNull();
  });

  it("returns null when old price is not greater than price", () => {
    expect(calculateDiscountPercent(10, 10)).toBeNull();
    expect(calculateDiscountPercent(10, 8)).toBeNull();
  });

  it("computes rounded percentage discount", () => {
    expect(calculateDiscountPercent(42, 49)).toBe(14);
    expect(calculateDiscountPercent(13.9, 16)).toBe(13);
  });
});

describe("calculateSubtotal", () => {
  it("sums unit price × quantity across lines", () => {
    expect(
      calculateSubtotal([
        { unitPrice: 10, quantity: 2 },
        { unitPrice: 5.5, quantity: 1 },
      ])
    ).toBe(25.5);
  });

  it("returns 0 for an empty cart", () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});

describe("calculateOrderTotals", () => {
  it("computes total as subtotal minus discount plus delivery", () => {
    const totals = calculateOrderTotals({ subtotal: 100, discountTotal: 10, deliveryFee: 3 });
    expect(totals).toEqual({ subtotal: 100, discountTotal: 10, deliveryFee: 3, total: 93 });
  });

  it("never lets total go negative from an over-large discount", () => {
    const totals = calculateOrderTotals({ subtotal: 10, discountTotal: 50, deliveryFee: 2 });
    expect(totals.total).toBe(2);
  });

  it("defaults discount and delivery to zero", () => {
    expect(calculateOrderTotals({ subtotal: 20 }).total).toBe(20);
  });
});

describe("formatCurrency", () => {
  it("formats with two decimals and JOD suffix", () => {
    expect(formatCurrency(42)).toBe("42.00 د.أ");
    expect(formatCurrency("13.9")).toBe("13.90 د.أ");
  });
});

describe("clampQuantity", () => {
  it("clamps to available stock", () => {
    expect(clampQuantity(10, 3)).toBe(3);
  });
  it("returns 0 when nothing is available", () => {
    expect(clampQuantity(1, 0)).toBe(0);
  });
  it("floors requested quantity at 1 when stock exists", () => {
    expect(clampQuantity(0, 5)).toBe(1);
  });
});

describe("toMoney", () => {
  it("rounds to 3 decimal places", () => {
    expect(toMoney(1.23456)).toBe(1.235);
  });
  it("throws on invalid input", () => {
    expect(() => toMoney("abc")).toThrow();
  });
});
