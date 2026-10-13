"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity-log";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function upsertDeliveryMethodAction(formData: FormData) {
  const user = await requirePermission("settings:write");
  const id = str(formData, "id");
  const data = {
    kind: str(formData, "kind") as "DELIVERY" | "PICKUP",
    nameAr: str(formData, "nameAr"),
    nameEn: str(formData, "nameEn") || null,
    sameDayCutoff: str(formData, "sameDayCutoff") || null,
    pickupAddress: str(formData, "pickupAddress") || null,
    pickupPrepMinutes: formData.get("pickupPrepMinutes") ? Number(formData.get("pickupPrepMinutes")) : null,
    estimatedTimeAr: str(formData, "estimatedTimeAr") || null,
  };

  if (!data.nameAr) throw new Error("الاسم مطلوب");

  const method = id
    ? await prisma.deliveryMethod.update({ where: { id }, data })
    : await prisma.deliveryMethod.create({ data });

  await logActivity({
    adminUserId: user.id,
    action: id ? "DELIVERY_METHOD_UPDATE" : "DELIVERY_METHOD_CREATE",
    entityType: "DeliveryMethod",
    entityId: method.id,
  });
  revalidatePath("/admin/delivery");
}

/**
 * "Delete" from the admin's point of view. Internally: if no past order ever used this
 * method's zones, it's a real row delete. If historical orders do reference it (via
 * DeliveryZone.orders), a hard delete would either FK-fail or corrupt those order records
 * — instead it's flipped to `isActive: false` and excluded from every admin/public list,
 * so it's functionally gone without an admin-facing "disable" control ever being shown
 * (see admin-delivery.tsx — there is no enable/disable button, only Add/Edit/Delete).
 */
export async function deleteDeliveryMethodAction(id: string) {
  const user = await requirePermission("settings:write");
  const referencedOrders = await prisma.order.count({ where: { deliveryZone: { deliveryMethodId: id } } });
  if (referencedOrders === 0) {
    await prisma.deliveryMethod.delete({ where: { id } });
    await logActivity({ adminUserId: user.id, action: "DELIVERY_METHOD_DELETE", entityType: "DeliveryMethod", entityId: id });
  } else {
    await prisma.deliveryMethod.update({ where: { id }, data: { isActive: false } });
    await prisma.deliveryZone.updateMany({ where: { deliveryMethodId: id }, data: { isActive: false } });
    await logActivity({
      adminUserId: user.id,
      action: "DELIVERY_METHOD_ARCHIVE",
      entityType: "DeliveryMethod",
      entityId: id,
      metadata: { reason: "referenced by historical orders", referencedOrders },
    });
  }
  revalidatePath("/admin/delivery");
}

export async function upsertDeliveryZoneAction(formData: FormData) {
  const user = await requirePermission("settings:write");
  const id = str(formData, "id");
  const nameAr = str(formData, "nameAr");
  const fee = Number(formData.get("fee") ?? 0);
  const deliveryMethodId = str(formData, "deliveryMethodId");
  const estimatedTimeAr = str(formData, "estimatedTimeAr") || null;

  if (!nameAr) throw new Error("اسم المنطقة مطلوب");
  if (!Number.isFinite(fee) || fee < 0) throw new Error("رسوم غير صالحة");
  if (!deliveryMethodId) throw new Error("طريقة التوصيل مطلوبة");

  const zone = id
    ? await prisma.deliveryZone.update({ where: { id }, data: { nameAr, fee, deliveryMethodId, estimatedTimeAr } })
    : await prisma.deliveryZone.create({ data: { nameAr, fee, deliveryMethodId, estimatedTimeAr } });

  await logActivity({
    adminUserId: user.id,
    action: id ? "DELIVERY_ZONE_UPDATE" : "DELIVERY_ZONE_CREATE",
    entityType: "DeliveryZone",
    entityId: zone.id,
    metadata: { nameAr, fee },
  });
  revalidatePath("/admin/delivery");
}

/** Same historical-safety principle as deleteDeliveryMethodAction, at the zone level. */
export async function deleteDeliveryZoneAction(id: string) {
  const user = await requirePermission("settings:write");
  const referencedOrders = await prisma.order.count({ where: { deliveryZoneId: id } });
  if (referencedOrders === 0) {
    await prisma.deliveryZone.delete({ where: { id } });
    await logActivity({ adminUserId: user.id, action: "DELIVERY_ZONE_DELETE", entityType: "DeliveryZone", entityId: id });
  } else {
    await prisma.deliveryZone.update({ where: { id }, data: { isActive: false } });
    await logActivity({
      adminUserId: user.id,
      action: "DELIVERY_ZONE_ARCHIVE",
      entityType: "DeliveryZone",
      entityId: id,
      metadata: { reason: "referenced by historical orders", referencedOrders },
    });
  }
  revalidatePath("/admin/delivery");
}
