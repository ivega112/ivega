import { describe, expect, it } from "vitest";
import { slugify, isValidSlug, buildSlugBase } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Smart Line Hyper K800 5G")).toBe("smart-line-hyper-k800-5g");
  });

  it("strips diacritics", () => {
    expect(slugify("café")).toBe("cafe");
  });

  it("collapses repeated separators and trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello   World--  ")).toBe("hello-world");
  });

  it("drops characters outside [a-z0-9-]", () => {
    expect(slugify("K800/5G (New!)")).toBe("k800-5g-new");
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase-latin-digit-hyphen strings", () => {
    expect(isValidSlug("smart-line-hyper-k800")).toBe(true);
  });

  it("rejects uppercase, spaces, or symbols", () => {
    expect(isValidSlug("Smart Line Hyper")).toBe(false);
    expect(isValidSlug("k800_5g")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });
});

describe("buildSlugBase", () => {
  it("prefers nameEn when present", () => {
    expect(buildSlugBase({ nameEn: "Hyper K800", nameAr: "هايبر K800" })).toBe("hyper-k800");
  });

  it("falls back to model when nameEn is missing", () => {
    expect(buildSlugBase({ nameEn: null, model: "K220-S", nameAr: "هايبر" })).toBe("k220-s");
  });

  it("falls back to a generated slug when nothing Latin is usable", () => {
    const base = buildSlugBase({ nameEn: null, model: null, nameAr: "هايبر" });
    expect(base).toMatch(/^product-[a-z0-9]+$/);
  });
});
