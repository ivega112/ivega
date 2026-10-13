import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

/** Appends the smallest deterministic numeric suffix ("-2", "-3", …) that isn't taken. */
export async function generateUniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  const normalizedBase = slugify(base) || `product-${Date.now().toString(36)}`;
  let candidate = normalizedBase;
  let suffix = 1;
  for (;;) {
    const clash = await prisma.product.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    suffix += 1;
    candidate = `${normalizedBase}-${suffix}`;
  }
}
