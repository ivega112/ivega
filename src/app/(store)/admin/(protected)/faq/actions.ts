"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity-log";

export async function upsertFaqAction(formData: FormData) {
  const user = await requirePermission("settings:write");
  const id = String(formData.get("id") ?? "").trim();
  const questionAr = String(formData.get("questionAr") ?? "").trim();
  const answerAr = String(formData.get("answerAr") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;

  if (!questionAr || !answerAr) throw new Error("السؤال والجواب مطلوبان");

  const item = id
    ? await prisma.faqItem.update({ where: { id }, data: { questionAr, answerAr, category } })
    : await prisma.faqItem.create({
        data: {
          questionAr,
          answerAr,
          category,
          displayOrder: (await prisma.faqItem.count()) + 1,
        },
      });

  await logActivity({ adminUserId: user.id, action: id ? "FAQ_UPDATE" : "FAQ_CREATE", entityType: "FaqItem", entityId: item.id });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function toggleFaqVisibilityAction(id: string) {
  const user = await requirePermission("settings:write");
  const item = await prisma.faqItem.findUniqueOrThrow({ where: { id } });
  await prisma.faqItem.update({ where: { id }, data: { isVisible: !item.isVisible } });
  await logActivity({ adminUserId: user.id, action: "FAQ_TOGGLE", entityType: "FaqItem", entityId: id });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function deleteFaqAction(id: string) {
  const user = await requirePermission("settings:write");
  await prisma.faqItem.delete({ where: { id } });
  await logActivity({ adminUserId: user.id, action: "FAQ_DELETE", entityType: "FaqItem", entityId: id });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function moveFaqAction(id: string, direction: "up" | "down") {
  const user = await requirePermission("settings:write");
  const items = await prisma.faqItem.findMany({ orderBy: { displayOrder: "asc" } });
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) return;

  const a = items[index]!;
  const b = items[swapIndex]!;
  await prisma.$transaction([
    prisma.faqItem.update({ where: { id: a.id }, data: { displayOrder: b.displayOrder } }),
    prisma.faqItem.update({ where: { id: b.id }, data: { displayOrder: a.displayOrder } }),
  ]);
  await logActivity({ adminUserId: user.id, action: "FAQ_REORDER", entityType: "FaqItem", entityId: id });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}
