import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Safe, server-only SKU generation for new products.
 *
 * Existing products already carry hand-picked SKUs like "IV-K800" / "IV-RC-ORG" (derived
 * from a model code at seed time) — those are preserved exactly as-is and never touched or
 * renumbered. New products can't rely on that scheme (there's no meaningful model code to
 * derive from, and the administrator must never type the SKU manually — see PROJECT spec).
 *
 * Instead this uses a Postgres SEQUENCE (`product_sku_seq`, see the
 * 20260806115133_product_sku_sequence migration): `nextval()` is atomic at the database
 * level, so concurrent product-creation requests can never receive the same number —
 * unlike `productCount + 1`, which races under concurrent inserts or after deletions.
 * The "IV-P-" prefix keeps generated SKUs visually and namespace-distinct from the
 * historical "IV-<MODEL>" ones, so the two schemes can never collide.
 */
export async function generateProductSku(): Promise<string> {
  const rows = await prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('product_sku_seq')`;
  const n = rows[0]?.nextval;
  if (n == null) throw new Error("تعذّر توليد رمز SKU");
  return `IV-P-${n.toString().padStart(6, "0")}`;
}
