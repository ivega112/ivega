import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, ProductBadge } from "@prisma/client";
import { normalizeSearchText } from "@/lib/search";

export type SortOption = "recommended" | "newest" | "price-asc" | "price-desc" | "popular";

export interface CatalogFilters {
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyInStock?: boolean;
  badge?: ProductBadge;
  isNew?: boolean;
  excludeNew?: boolean;
  discounted?: boolean;
  prioritizeNew?: boolean;
  query?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE_DEFAULT = 24;

// Every branch ends with `id: "asc"` as a final tiebreaker. Without it, rows that tie on
// the primary sort key (e.g. multiple products with soldCount 0, or identical createdAt)
// have no guaranteed order in Postgres and can appear to "reshuffle" between requests —
// this is what made sorting look non-deterministic before.
function buildOrderBy(sort?: SortOption, prioritizeNew = false): Prisma.ProductOrderByWithRelationInput[] {
  const withNewFirst = (order: Prisma.ProductOrderByWithRelationInput[]) => (prioritizeNew ? [{ isNew: "desc" as const }, ...order] : order);
  switch (sort) {
    case "newest":
      return withNewFirst([{ createdAt: "desc" }, { id: "asc" }]);
    case "price-asc":
      return withNewFirst([{ price: "asc" }, { id: "asc" }]);
    case "price-desc":
      return withNewFirst([{ price: "desc" }, { id: "asc" }]);
    case "popular":
      return withNewFirst([{ soldCount: "desc" }, { id: "asc" }]);
    case "recommended":
    default:
      // Existing deliberate criteria, in priority order: admin-featured products first,
      // then admin-set manual display order, then recency — not an invented score.
      return withNewFirst([{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }, { id: "asc" }]);
  }
}

export async function getProducts(filters: CatalogFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, filters.pageSize ?? PAGE_SIZE_DEFAULT);

  const where: Prisma.ProductWhereInput = {
    isVisible: true,
    isArchived: false,
  };

  // A product matches a category via its one required primary categoryId OR any of its
  // optional secondary ProductCategory links (see schema comment) — a category page/filter
  // must show both, not just primary-only, or "assign to an additional category" would be
  // a no-op from the shopper's point of view.
  if (filters.categorySlug) {
    where.OR = [
      { category: { slug: filters.categorySlug } },
      { additionalCategories: { some: { category: { slug: filters.categorySlug } } } },
    ];
  }
  if (filters.brandSlug) where.brand = { slug: filters.brandSlug };
  if (filters.badge) where.badge = filters.badge;
  // Keep existing products carrying the legacy NEW badge in the same editorial section
  // as products selected via the newer dedicated checkbox.
  if (filters.isNew) where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { OR: [{ isNew: true }, { badge: "NEW" }] }];
  if (filters.excludeNew) where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { isNew: false, NOT: { badge: "NEW" } }];
  if (filters.discounted) where.oldPrice = { not: null };
  // Store availability is controlled exclusively by `isVisible`. Quantities remain
  // administrative records and must never remove a published product from the catalog.
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  // Arabic-friendly search: normalize query, then match against a normalized haystack
  // using Postgres ILIKE-per-token (keeps this DB-agnostic without a search extension).
  let productIds: string[] | undefined;
  if (filters.query && filters.query.trim().length > 0) {
    const normalized = normalizeSearchText(filters.query);
    const tokens = normalized.split(" ").filter(Boolean);
    if (tokens.length > 0) {
      const candidates = await prisma.product.findMany({
        where: { isVisible: true, isArchived: false },
        select: { id: true, nameAr: true, nameEn: true, sku: true, model: true, searchKeywords: true },
      });
      const { buildSearchHaystack } = await import("@/lib/search");
      productIds = candidates
        .filter((p) => {
          const haystack = buildSearchHaystack({
            id: p.id,
            nameAr: p.nameAr,
            nameEn: p.nameEn,
            sku: p.sku,
            model: p.model,
            searchKeywords: p.searchKeywords,
          });
          return tokens.every((t) => haystack.includes(t));
        })
        .map((p) => p.id);
      where.id = { in: productIds };
    }
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(filters.sort, filters.prioritizeNew),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { nameAr: true, slug: true } },
        brand: { select: { nameAr: true, slug: true } },
        additionalCategories: { select: { categoryId: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isArchived: false },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      category: true,
      brand: true,
      additionalCategories: { select: { categoryId: true } },
    },
  });
}

export async function getRelatedProducts(categoryId: string, excludeId: string, take = 4) {
  return prisma.product.findMany({
    where: { categoryId, isVisible: true, isArchived: false, NOT: { id: excludeId } },
    take,
    orderBy: { soldCount: "desc" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, additionalCategories: { select: { categoryId: true } } },
  });
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, additionalCategories: { select: { categoryId: true } } },
  });
  const map = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
}
