import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Confirms a PENDING_WHATSAPP/CONTACTED order without depending on inventory. Product
 * quantities are informational/admin-only; a visible product is always orderable.
 * `inventoryApplied` remains the idempotency marker for recording confirmed sales.
 */
export async function confirmOrderInventory(orderId: string, adminUserId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    if (order.inventoryApplied) {
      return order; // already confirmed once — do not double-decrement
    }

    for (const item of order.items) {
      if (!item.productId) continue;
      // soldCount powers the "الأكثر مبيعاً" sort and only moves on confirmed sales.
      await tx.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.quantity } },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED", inventoryApplied: true },
    });

    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: "CONFIRMED" },
    });

    await tx.activityLog.create({
      data: {
        adminUserId,
        action: "ORDER_CONFIRM",
        entityType: "Order",
        entityId: orderId,
      },
    });

    return updatedOrder;
  });
}

/**
 * Cancels a previously confirmed order and rolls back its sales count exactly once.
 */
export async function cancelOrderAndRestoreInventory(orderId: string, adminUserId: string, note?: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    if (order.inventoryApplied) {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { soldCount: { decrement: item.quantity } },
        });
      }
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", inventoryApplied: false },
    });

    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: "CANCELLED", note },
    });

    await tx.activityLog.create({
      data: { adminUserId, action: "ORDER_CANCEL", entityType: "Order", entityId: orderId },
    });

    return updatedOrder;
  });
}
