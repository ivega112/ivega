"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { getStorageAdapter } from "@/lib/storage";

/**
 * Full sync for a category's *secondary* product assignments against whatever `productIds`
 * were submitted: any not-submitted-but-currently-assigned product is removed, any
 * submitted-but-not-yet-assigned one is added. Products whose *primary* category is this one
 * are never touched here — their checkbox is rendered disabled client-side so they never even
 * reach `productIds`, and this function only ever writes to the secondary join table anyway.
 */
async function syncSecondaryProducts(categoryId: string, desiredIds: Set<string>) {
  if (desiredIds.size > 0) {
    const validCount = await prisma.product.count({ where: { id: { in: [...desiredIds] } } });
    if (validCount !== desiredIds.size) throw new Error("أحد المنتجات المحددة غير موجود");
  }
  const current = await prisma.productCategory.findMany({ where: { categoryId }, select: { productId: true } });
  const currentIds = new Set(current.map((c) => c.productId));
  const toAdd = [...desiredIds].filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));

  await prisma.$transaction([
    prisma.productCategory.createMany({ data: toAdd.map((productId) => ({ productId, categoryId })), skipDuplicates: true }),
    prisma.productCategory.deleteMany({ where: { categoryId, productId: { in: toRemove } } }),
  ]);
}

export async function upsertCategoryAction(formData: FormData) {
  await requirePermission("categories:write");
  const id = String(formData.get("id") ?? "").trim();
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const productIds = new Set(formData.getAll("productIds").map(String).filter(Boolean));
  const isFeatured = formData.get("isFeatured") === "on";

  // Image is optional on every save — only touch imageUrl when the admin actually picked a
  // new file, so re-saving name/slug/description doesn't wipe out an existing image.
  const imageFile = formData.get("image");
  let imageUrl: string | undefined;
  if (imageFile instanceof File && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const result = await getStorageAdapter().upload(buffer, imageFile.type);
    imageUrl = result.url;
  }

  if (id) {
    await prisma.category.update({ where: { id }, data: { nameAr, slug, description, isFeatured, ...(imageUrl ? { imageUrl } : {}) } });
    await syncSecondaryProducts(id, productIds);
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath("/");
    redirect(`/admin/categories/${id}?saved=1`);
  }

  const created = await prisma.category.create({ data: { nameAr, slug, description, isFeatured, ...(imageUrl ? { imageUrl } : {}) } });
  await syncSecondaryProducts(created.id, productIds);
  revalidatePath("/admin/categories");
  revalidatePath("/");
  // Send the admin straight to the new category's own edit page — gives a concrete
  // confirmation the save actually went through instead of silently staying on a blank form.
  redirect(`/admin/categories/${created.id}?created=1`);
}

export async function deleteCategoryAction(id: string) {
  await requirePermission("categories:write");
  // Count both the primary relation and any secondary (many-to-many) assignments —
  // archiving-instead-of-deleting must trigger for either, or a category that's only used
  // as someone's *additional* category (never anyone's primary one) could be hard-deleted
  // out from under products still actually assigned to it.
  const [primaryLinked, secondaryLinked] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.productCategory.count({ where: { categoryId: id } }),
  ]);
  if (primaryLinked > 0 || secondaryLinked > 0) {
    await prisma.category.update({ where: { id }, data: { isArchived: true, isVisible: false } });
  } else {
    await prisma.category.delete({ where: { id } });
  }
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function toggleCategoryVisibilityAction(id: string, currentVisibility: boolean) {
  await requirePermission("categories:write");
  await prisma.category.update({
    where: { id },
    data: { isVisible: !currentVisibility },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
