"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity-log";

const VALID_SLUGS = ["delivery", "payment", "returns", "privacy", "terms"];

export async function updatePolicyAction(formData: FormData) {
  const user = await requirePermission("settings:write");
  const slug = String(formData.get("slug") ?? "");
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const bodyAr = String(formData.get("bodyAr") ?? "").trim();

  if (!VALID_SLUGS.includes(slug)) throw new Error("سياسة غير معروفة");
  if (!titleAr || !bodyAr) throw new Error("العنوان والمحتوى مطلوبان");

  await prisma.policyPage.upsert({
    where: { slug },
    create: { slug, titleAr, bodyAr },
    update: { titleAr, bodyAr },
  });

  await logActivity({ adminUserId: user.id, action: "POLICY_UPDATE", entityType: "PolicyPage", entityId: slug });
  revalidatePath("/admin/policies");
  revalidatePath(`/policies/${slug}`);
}
