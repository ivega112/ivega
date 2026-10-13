import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/catalog";
import { mapProductToCard } from "@/lib/map-product-card";
import { getEffectivePricesForProducts } from "@/lib/campaign-pricing";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const products = await getProductsByIds(ids);
  const effectivePrices = await getEffectivePricesForProducts(
    products.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      brandId: p.brandId,
      price: Number(p.price),
      additionalCategoryIds: p.additionalCategories.map((c) => c.categoryId),
    }))
  );
  return NextResponse.json({ products: products.map((p) => mapProductToCard(p, effectivePrices.get(p.id))) });
}
