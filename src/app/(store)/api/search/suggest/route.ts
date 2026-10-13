import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSearchHaystack, normalizeSearchText } from "@/lib/search";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 6;

export async function GET(request: Request) {
  const ip = await getClientIp();
  // Generous limit — legitimate use is one request per debounced keystroke — mainly there
  // to blunt scripted scraping/DoS against this public, unauthenticated endpoint.
  const allowed = await checkRateLimit(`search:${ip}`, { windowMs: 60 * 1000, max: 60 });
  if (!allowed) {
    return NextResponse.json({ suggestions: [] }, { status: 429 });
  }

  const url = new URL(request.url);
  const rawQuery = url.searchParams.get("q") ?? "";
  const query = rawQuery.trim();

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Same normalized-haystack matching used by the shop's full search (see src/lib/catalog.ts)
  // — real product data, no separate/fake search index.
  const candidates = await prisma.product.findMany({
    where: { isVisible: true, isArchived: false },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      nameEn: true,
      sku: true,
      model: true,
      searchKeywords: true,
      price: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      category: { select: { nameAr: true } },
      brand: { select: { nameAr: true } },
    },
    take: 200,
  });

  const suggestions = candidates
    .filter((p) => {
      const haystack = buildSearchHaystack({
        id: p.id,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        sku: p.sku,
        model: p.model,
        brandName: p.brand.nameAr,
        categoryName: p.category.nameAr,
        searchKeywords: p.searchKeywords,
      });
      return tokens.every((t) => haystack.includes(t));
    })
    .slice(0, SUGGESTION_LIMIT)
    .map((p) => ({
      slug: p.slug,
      nameAr: p.nameAr,
      price: Number(p.price),
      imageUrl: p.images[0]?.url ?? null,
      categoryName: p.category.nameAr,
      brandName: p.brand.nameAr,
    }));

  return NextResponse.json({ suggestions });
}
