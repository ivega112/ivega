"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guard";
import { confirmOrderInventory, cancelOrderAndRestoreInventory, InsufficientStockError } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";

export interface OrderActionState {
  ok: boolean;
  error?: string;
}

export async function confirmOrderAction(orderId: string): Promise<OrderActionState> {
  const user = await requirePermission("orders:confirm");
  try {
    await confirmOrderInventory(orderId, user.id);
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { ok: false, error: `الكمية غير كافية للمنتج (متوفر: ${err.available}, مطلوب: ${err.requested})` };
    }
    return { ok: false, error: "تعذّر تأكيد الطلب" };
  }
}

export async function cancelOrderAction(orderId: string, note?: string): Promise<OrderActionState> {
  const user = await requirePermission("orders:cancel");
  await cancelOrderAndRestoreInventory(orderId, user.id, note);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function setOrderStatusAction(orderId: string, status: "CONTACTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "COMPLETED"): Promise<OrderActionState> {
  const user = await requirePermission("orders:confirm");
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.orderStatusHistory.create({ data: { orderId, fromStatus: order.status, toStatus: status } }),
    prisma.activityLog.create({ data: { adminUserId: user.id, action: `ORDER_${status}`, entityType: "Order", entityId: orderId } }),
  ]);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
