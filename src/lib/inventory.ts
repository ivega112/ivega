import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export class InsufficientStockError extends Error {
  constructor(public productId: string, public available: number, public requested: number) {
    super(`Insufficient stock for product ${productId}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
  }
}

/**
 * Confirms a PENDING_WHATSAPP/CONTACTED order: verifies stock for every line item and
 * decrements it atomically inside one transaction. Rejects the whole confirmation if any
 * item is short. Idempotent — a second call on an already-applied order is a no-op guard.
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
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      if (product.quantity < item.quantity) {
        throw new InsufficientStockError(product.id, product.quantity, item.quantity);
      }
    }

    for (const item of order.items) {
      if (!item.productId) continue;
      // soldCount powers the "الأكثر مبيعاً" (best-selling) sort and the admin dashboard's
      // best-sellers list — it must only move here, on real confirmed sales, not be a
      // stand-in/placeholder value.
      const updated = await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          orderId: order.id,
          type: "ORDER_CONFIRM",
          quantity: -item.quantity,
          balanceAfter: updated.quantity,
        },
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
 * Cancels a previously CONFIRMED order and restores inventory exactly once, guarded by
 * the `inventoryApplied` flag so double-cancellation cannot double-restore stock.
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
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            orderId: order.id,
            type: "ORDER_CANCEL_RESTORE",
            quantity: item.quantity,
            balanceAfter: updated.quantity,
          },
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
