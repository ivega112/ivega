import type { ProductCardData } from "@/components/storefront/product-card";
import type { EffectivePrice } from "@/lib/campaign-pricing";

interface ProductWithRelations {
  id: string;
  slug: string;
  nameAr: string;
  shortSpec: string | null;
  price: unknown;
  oldPrice: unknown;
  quantity: number;
  badge: string;
  images: { url: string }[];
  brand?: { nameAr: string } | null;
  category?: { nameAr: string } | null;
}

/**
 * `effectivePrice`, when given, is the resolved campaign price (src/lib/campaign-pricing.ts)
 * — it takes over `price`/`oldPrice` entirely so the card shows the campaign's final price
 * with the *original* base price struck through, exactly like a manually-set `oldPrice`
 * would render, using the same existing UI with no changes needed there. A campaign
 * intentionally overrides rather than stacks with any manually-set `oldPrice` on the
 * product itself, to avoid an ambiguous double-discount display.
 */
export function mapProductToCard(product: ProductWithRelations, effectivePrice?: EffectivePrice | null): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    nameAr: product.nameAr,
    shortSpec: product.shortSpec,
    price: effectivePrice ? effectivePrice.finalPrice : Number(product.price),
    oldPrice: effectivePrice ? effectivePrice.basePrice : product.oldPrice != null ? Number(product.oldPrice) : null,
    quantity: product.quantity,
    badge: product.badge,
    imageUrl: product.images[0]?.url ?? null,
    brandName: product.brand?.nameAr,
    categoryName: product.category?.nameAr,
  };
}
