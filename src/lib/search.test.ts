import { describe, expect, it } from "vitest";
import { normalizeSearchText, matchesQuery, buildSearchHaystack } from "./search";

describe("normalizeSearchText", () => {
  it("unifies Alef variants", () => {
    expect(normalizeSearchText("أحمد")).toBe(normalizeSearchText("احمد"));
    expect(normalizeSearchText("إحمد")).toBe(normalizeSearchText("احمد"));
    expect(normalizeSearchText("آحمد")).toBe(normalizeSearchText("احمد"));
  });

  it("strips Arabic diacritics", () => {
    expect(normalizeSearchText("رِسِيفِر")).toBe(normalizeSearchText("رسيفر"));
  });

  it("unifies ta-marbuta and ya", () => {
    expect(normalizeSearchText("شاشة")).toBe(normalizeSearchText("شاشه"));
    expect(normalizeSearchText("فتى")).toContain("فتي");
  });

  it("lowercases Latin text and collapses whitespace", () => {
    expect(normalizeSearchText("  HYPER   K800  ")).toBe("hyper k800");
  });
});

describe("matchesQuery", () => {
  const product = {
    id: "1",
    nameAr: "رسيفر Smart Line HYPER K800 5G",
    sku: "IV-K800",
    brandName: "Smart Line",
    categoryName: "رسيفرات",
    searchKeywords: "ريسيفر ستلايت",
  };

  it("matches normalized Arabic query regardless of Alef variant", () => {
    expect(matchesQuery(product, "ريسيفر")).toBe(true);
  });

  it("matches Latin/SKU model queries", () => {
    expect(matchesQuery(product, "K800")).toBe(true);
    expect(matchesQuery(product, "iv-k800")).toBe(true);
  });

  it("requires every token to match", () => {
    expect(matchesQuery(product, "رسيفر أزرق")).toBe(false);
  });

  it("empty query matches everything", () => {
    expect(matchesQuery(product, "")).toBe(true);
  });
});

describe("buildSearchHaystack", () => {
  it("includes all searchable fields normalized", () => {
    const haystack = buildSearchHaystack({
      id: "1",
      nameAr: "ريموت",
      sku: "RC-1",
      brandName: "ORYX",
    });
    expect(haystack).toContain("ريموت");
    expect(haystack).toContain("rc");
    expect(haystack).toContain("oryx");
  });
});
