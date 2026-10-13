"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity-log";

// The store supports exactly two payment methods (COD, CliQ) — fixed by product spec, not
// admin-configurable. There is deliberately no create/delete/enable-disable action: the
// only thing an administrator can change is each method's public instructions text.
const ALLOWED_PAYMENT_METHOD_IDS = new Set(["cod", "cliq"]);

export async function updatePaymentInstructionsAction(id: string, formData: FormData) {
  const user = await requirePermission("settings:write");
  if (!ALLOWED_PAYMENT_METHOD_IDS.has(id)) {
    throw new Error("طريقة الدفع غير معروفة");
  }
  const description = String(formData.get("description") ?? "").trim() || null;
  if (description && description.length > 500) throw new Error("النص طويل جداً");

  await prisma.paymentMethod.update({ where: { id }, data: { description } });
  await logActivity({ adminUserId: user.id, action: "PAYMENT_METHOD_UPDATE", entityType: "PaymentMethod", entityId: id });
  revalidatePath("/admin/payments");
  revalidatePath("/checkout/review");
}
