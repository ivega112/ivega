"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { getStorageAdapter } from "@/lib/storage";

export async function upsertBrandAction(formData: FormData) {
  await requirePermission("brands:write");
  const id = String(formData.get("id") ?? "").trim();
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  // A product has exactly one brand (Product.brandId is required, not a join table), so this
  // list is reassignment-only: products already on this brand are rendered checked+disabled
  // client-side (never reach here), and anything submitted is a product the admin is actively
  // moving onto this brand from whatever brand it had before.
  const reassignIds = [...new Set(formData.getAll("productIds").map(String).filter(Boolean))];

  // Logo is optional on every save — only touch logoUrl when the admin actually picked a new
  // file, so re-saving name/slug/description doesn't wipe out an existing logo.
  const logoFile = formData.get("logo");
  let logoUrl: string | undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const result = await getStorageAdapter().upload(buffer, logoFile.type);
    logoUrl = result.url;
  }

  if (id) {
    await prisma.brand.update({ where: { id }, data: { nameAr, slug, description, ...(logoUrl ? { logoUrl } : {}) } });
    if (reassignIds.length > 0) {
      await prisma.product.updateMany({ where: { id: { in: reassignIds } }, data: { brandId: id } });
    }
    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${id}`);
    revalidatePath("/");
    redirect(`/admin/brands/${id}?saved=1`);
  }

  const created = await prisma.brand.create({ data: { nameAr, slug, description, ...(logoUrl ? { logoUrl } : {}) } });
  if (reassignIds.length > 0) {
    await prisma.product.updateMany({ where: { id: { in: reassignIds } }, data: { brandId: created.id } });
  }
  revalidatePath("/admin/brands");
  revalidatePath("/");
  redirect(`/admin/brands/${created.id}?created=1`);
}

export async function deleteBrandAction(id: string) {
  await requirePermission("brands:write");
  const linked = await prisma.product.count({ where: { brandId: id } });
  if (linked > 0) {
    await prisma.brand.update({ where: { id }, data: { isArchived: true, isVisible: false } });
  } else {
    await prisma.brand.delete({ where: { id } });
  }
  revalidatePath("/admin/brands");
  revalidatePath("/");
}

export async function toggleBrandVisibilityAction(id: string, currentVisibility: boolean) {
  await requirePermission("brands:write");
  await prisma.brand.update({
    where: { id },
    data: { isVisible: !currentVisibility },
  });
  revalidatePath("/admin/brands");
  revalidatePath("/");
}
