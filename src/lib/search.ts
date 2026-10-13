const ARABIC_DIACRITICS = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

/**
 * Normalizes Arabic (and mixed Arabic/Latin) text for search matching:
 * unifies Alef variants, strips diacritics/tatweel, unifies ta-marbuta/ya,
 * removes non-alphanumeric noise, lowercases Latin, collapses whitespace.
 */
export function normalizeSearchText(input: string): string {
  if (!input) return "";
  let s = input.trim().toLowerCase();
  s = s.replace(ARABIC_DIACRITICS, "");
  s = s.replace(TATWEEL, "");
  s = s.replace(/[إأآا]/g, "ا");
  s = s.replace(/ى/g, "ي");
  s = s.replace(/ة/g, "ه");
  s = s.replace(/ؤ/g, "و");
  s = s.replace(/ئ/g, "ي");
  s = s.replace(/[^\p{L}\p{N}\s-]/gu, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function searchTokens(input: string): string[] {
  return normalizeSearchText(input).split(" ").filter(Boolean);
}

export interface SearchableProduct {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  sku: string;
  model?: string | null;
  brandName?: string | null;
  categoryName?: string | null;
  searchKeywords?: string | null;
}

/** Builds the flattened, normalized haystack stored/used for search matching a product. */
export function buildSearchHaystack(product: SearchableProduct): string {
  return normalizeSearchText(
    [
      product.nameAr,
      product.nameEn,
      product.sku,
      product.model,
      product.brandName,
      product.categoryName,
      product.searchKeywords,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function matchesQuery(product: SearchableProduct, query: string): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;
  const haystack = buildSearchHaystack(product);
  return tokens.every((t) => haystack.includes(t));
}
