import { describe, expect, it } from "vitest";
import { generateOrderNumber } from "./order-number";

describe("generateOrderNumber", () => {
  it("matches the IV-YYMMDD-XXXX format", () => {
    const number = generateOrderNumber(new Date("2026-03-05T12:00:00Z"));
    expect(number).toMatch(/^IV-260305-[0-9A-Z]{4}$/);
  });

  it("generates different suffixes across calls (collision-resistant, not proof)", () => {
    const numbers = new Set(Array.from({ length: 20 }, () => generateOrderNumber()));
    expect(numbers.size).toBeGreaterThan(1);
  });
});
