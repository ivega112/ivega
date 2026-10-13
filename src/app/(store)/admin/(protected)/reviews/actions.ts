"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity-log";

export async function approveReviewAction(id: string) {
  const user = await requirePermission("homepage:write");
  await prisma.review.update({ where: { id }, data: { isApproved: true } });
  await logActivity({ adminUserId: user.id, action: "REVIEW_APPROVE", entityType: "Review", entityId: id });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function rejectReviewAction(id: string) {
  const user = await requirePermission("homepage:write");
  await prisma.review.update({ where: { id }, data: { isApproved: false, isVisible: false } });
  await logActivity({ adminUserId: user.id, action: "REVIEW_REJECT", entityType: "Review", entityId: id });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function toggleReviewVisibilityAction(id: string) {
  const user = await requirePermission("homepage:write");
  const review = await prisma.review.findUniqueOrThrow({ where: { id } });
  await prisma.review.update({ where: { id }, data: { isVisible: !review.isVisible } });
  await logActivity({ adminUserId: user.id, action: "REVIEW_VISIBILITY_TOGGLE", entityType: "Review", entityId: id });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function toggleReviewFeaturedAction(id: string) {
  const user = await requirePermission("homepage:write");
  const review = await prisma.review.findUniqueOrThrow({ where: { id } });
  await prisma.review.update({ where: { id }, data: { isFeatured: !review.isFeatured } });
  await logActivity({ adminUserId: user.id, action: "REVIEW_FEATURE_TOGGLE", entityType: "Review", entityId: id });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function archiveReviewAction(id: string) {
  const user = await requirePermission("homepage:write");
  await prisma.review.update({ where: { id }, data: { isArchived: true, isVisible: false } });
  await logActivity({ adminUserId: user.id, action: "REVIEW_ARCHIVE", entityType: "Review", entityId: id });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function createReviewAction(formData: FormData) {
  const user = await requirePermission("homepage:write");
  const authorName = String(formData.get("authorName") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  const bodyAr = String(formData.get("bodyAr") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim() || null;

  if (!authorName || !bodyAr) throw new Error("الاسم والنص مطلوبان");
  if (rating < 1 || rating > 5) throw new Error("التقييم يجب أن يكون بين 1 و5");
  if (productId) {
    const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!exists) throw new Error("المنتج المحدد غير موجود");
  }

  const review = await prisma.review.create({ data: { authorName, rating, bodyAr, productId, isApproved: true } });
  await logActivity({ adminUserId: user.id, action: "REVIEW_CREATE", entityType: "Review", entityId: review.id });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

/**
 * The administrator is intentionally allowed to edit review text/rating/product-link —
 * e.g. tidying up informal wording — same permission gate and sanitization posture as
 * createReviewAction (React escapes bodyAr on render everywhere it's displayed publicly,
 * so no unsafe-HTML surface is introduced by allowing free-text edits here).
 */
export async function updateReviewAction(id: string, formData: FormData) {
  const user = await requirePermission("homepage:write");
  const authorName = String(formData.get("authorName") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  const bodyAr = String(formData.get("bodyAr") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim() || null;

  if (!authorName || !bodyAr) throw new Error("الاسم والنص مطلوبان");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("التقييم يجب أن يكون بين 1 و5");
  if (productId) {
    const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!exists) throw new Error("المنتج المحدد غير موجود");
  }

  await prisma.review.update({ where: { id }, data: { authorName, rating, bodyAr, productId } });
  await logActivity({ adminUserId: user.id, action: "REVIEW_UPDATE", entityType: "Review", entityId: id });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

/** Permanent delete — distinct from archiveReviewAction (soft-hide). Reviews carry no
 * foreign-key dependents (no order/inventory links), so this is always a safe hard delete. */
export async function deleteReviewAction(id: string) {
  const user = await requirePermission("homepage:write");
  await prisma.review.delete({ where: { id } });
  await logActivity({ adminUserId: user.id, action: "REVIEW_DELETE", entityType: "Review", entityId: id });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}
