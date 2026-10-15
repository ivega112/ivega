"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { productFormSchema } from "@/lib/validation";
import { getStorageAdapter } from "@/lib/storage";
import { generateProductSku } from "@/lib/sku";
import { buildSlugBase } from "@/lib/slug";
import { generateUniqueProductSlug } from "@/lib/slug-server";

export interface ProductActionState {
  ok: boolean;
  error?: string;
  productId?: string;
}

function extractProductInput(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return {
    nameAr: String(raw.nameAr ?? ""),
    nameEn: raw.nameEn ? String(raw.nameEn) : undefined,
    // Manual slug override is optional and only meaningful on create (see comment in
    // validation.ts) — the update action below never reads it.
    slug: raw.slug ? String(raw.slug) : undefined,
    model: raw.model ? String(raw.model) : undefined,
    categoryId: String(raw.categoryId ?? ""),
    brandId: String(raw.brandId ?? ""),
    shortSpec: raw.shortSpec ? String(raw.shortSpec) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    searchKeywords: raw.searchKeywords ? String(raw.searchKeywords) : undefined,
    seoTitle: raw.seoTitle ? String(raw.seoTitle) : undefined,
    seoDescription: raw.seoDescription ? String(raw.seoDescription) : undefined,
    price: Number(raw.price),
    oldPrice: raw.oldPrice ? Number(raw.oldPrice) : null,
    quantity: Number(raw.quantity ?? 0),
    lowStockThreshold: Number(raw.lowStockThreshold ?? 5),
    badge: String(raw.badge ?? "NONE"),
    isVisible: raw.isVisible === "on",
    isFeatured: raw.isFeatured === "on",
    isNew: raw.isNew === "on",
    warrantyInfo: raw.warrantyInfo ? String(raw.warrantyInfo) : undefined,
    supportInfo: raw.supportInfo ? String(raw.supportInfo) : undefined,
  };
}

const MAX_SKU_RETRIES = 3;

/** Full-replace sync of a product's *secondary* categories (never touches primary categoryId). */
async function syncAdditionalCategories(productId: string, formData: FormData) {
  const ids = [...new Set(formData.getAll("additionalCategoryIds").map(String).filter(Boolean))];
  if (ids.length > 0) {
    const validCount = await prisma.category.count({ where: { id: { in: ids } } });
    if (validCount !== ids.length) throw new Error("أحد الأقسام الإضافية المحددة غير موجود");
  }
  await prisma.$transaction([
    prisma.productCategory.deleteMany({ where: { productId } }),
    prisma.productCategory.createMany({ data: ids.map((categoryId) => ({ productId, categoryId })) }),
  ]);
}

export async function createProductAction(formData: FormData): Promise<ProductActionState> {
  try {
    await requirePermission("products:write");
    const parsed = productFormSchema.safeParse(extractProductInput(formData));
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

    if (parsed.data.price != null && parsed.data.oldPrice != null && parsed.data.oldPrice <= parsed.data.price) {
      return { ok: false, error: "السعر قبل الخصم يجب أن يكون أعلى من السعر الحالي" };
    }

    const manualSlug = parsed.data.slug;
    const slugBase = manualSlug || buildSlugBase(parsed.data);
    if (manualSlug) {
      const clash = await prisma.product.findUnique({ where: { slug: manualSlug } });
      if (clash) return { ok: false, error: "الرابط (slug) مستخدم مسبقاً" };
    }
    const slug = manualSlug || (await generateUniqueProductSlug(slugBase));

    const { slug: _ignoredSlug, ...dataWithoutSlug } = parsed.data;
    void _ignoredSlug;

    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_SKU_RETRIES; attempt++) {
      const sku = await generateProductSku();
      try {
        const product = await prisma.product.create({
          data: { ...dataWithoutSlug, slug, sku, badge: parsed.data.badge as never, needsImage: true },
        });
        await handleImageUpload(formData, product.id);
        await syncAdditionalCategories(product.id, formData);
        revalidatePath("/admin/products");
        return { ok: true, productId: product.id };
      } catch (err) {
        lastError = err;
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
        console.error("createProductAction inner error:", err);
        return { ok: false, error: err instanceof Error ? err.message : "حدث خطأ أثناء الإضافة" };
      }
    }
    console.error("createProductAction: exhausted SKU retries", lastError);
    return { ok: false, error: "تعذّر إنشاء المنتج، حاول مرة أخرى" };
  } catch (err) {
    console.error("createProductAction outer error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "حدث خطأ غير متوقع" };
  }
}

export async function updateProductAction(productId: string, formData: FormData): Promise<ProductActionState> {
  try {
    await requirePermission("products:write");
    const parsed = productFormSchema.safeParse(extractProductInput(formData));
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

    if (parsed.data.price != null && parsed.data.oldPrice != null && parsed.data.oldPrice <= parsed.data.price) {
      return { ok: false, error: "السعر قبل الخصم يجب أن يكون أعلى من السعر الحالي" };
    }

    const { slug: _ignoredSlug, ...dataWithoutSlug } = parsed.data;
    void _ignoredSlug;

    await prisma.product.update({ where: { id: productId }, data: { ...dataWithoutSlug, badge: parsed.data.badge as never } });
    await handleImageUpload(formData, productId);
    await syncAdditionalCategories(productId, formData);

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { ok: true, productId };
  } catch (err) {
    console.error("updateProductAction error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ" };
  }
}

/** Accepts one or more files under the "images" field — each submission just appends more
 * to the product's gallery, so repeated edits build up a multi-image set over time. */
async function handleImageUpload(formData: FormData, productId: string) {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  const adapter = getStorageAdapter();
  let existingCount = await prisma.productImage.count({ where: { productId } });
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await adapter.upload(buffer, file.type);
    await prisma.productImage.create({
      data: { productId, url: result.url, isPrimary: existingCount === 0, sortOrder: existingCount },
    });
    existingCount += 1;
  }
  await prisma.product.update({ where: { id: productId }, data: { needsImage: false } });
}

export async function deleteProductImageAction(imageId: string) {
  await requirePermission("products:write");
  const image = await prisma.productImage.findUniqueOrThrow({ where: { id: imageId } });
  const { productId } = image;
  await prisma.productImage.delete({ where: { id: imageId } });
  // If the deleted image was the primary one, promote whichever image is now first.
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  const remaining = await prisma.productImage.count({ where: { productId } });
  if (remaining === 0) await prisma.product.update({ where: { id: productId }, data: { needsImage: true } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
}

export async function setPrimaryProductImageAction(imageId: string) {
  await requirePermission("products:write");
  const image = await prisma.productImage.findUniqueOrThrow({ where: { id: imageId } });
  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId: image.productId }, data: { isPrimary: false } }),
    prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
  revalidatePath(`/admin/products/${image.productId}`);
  revalidatePath("/admin/products");
}

export async function toggleVisibilityAction(productId: string) {
  await requirePermission("products:write");
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await prisma.product.update({ where: { id: productId }, data: { isVisible: !product.isVisible } });
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

export async function archiveProductAction(productId: string) {
  await requirePermission("products:delete");
  await prisma.$transaction([
    prisma.inventoryMovement.deleteMany({ where: { productId } }),
    prisma.productImage.deleteMany({ where: { productId } }),
    prisma.product.delete({ where: { id: productId } }),
  ]);
  revalidatePath("/admin/products");
}
