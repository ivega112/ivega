import "server-only";
import { prisma } from "@/lib/prisma";
import { calculateOrderTotals, calculateSubtotal, toMoney } from "@/lib/pricing";
import { buildWhatsappMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import { generateOrderNumber } from "@/lib/order-number";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { getStoreSettings } from "@/lib/settings";
import { getEffectivePricesForProducts } from "@/lib/campaign-pricing";

export class CheckoutError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

export interface CreateOrderResult {
  orderNumber: string;
  whatsappUrl: string;
  total: number;
  reused: boolean;
}

/**
 * Server-side checkout: revalidates product existence and price for every line, computes totals
 * from DB state only (never trusts client totals), and is idempotent via idempotencyKey —
 * retrying with the same key returns the existing order instead of creating a duplicate.
 */
export async function createOrderFromCheckout(rawInput: unknown): Promise<CreateOrderResult> {
  const input: CheckoutInput = checkoutSchema.parse(rawInput);

  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) {
    const settings = await getStoreSettings();
    const message = existing.whatsappMessage ?? "";
    return {
      orderNumber: existing.orderNumber,
      whatsappUrl: buildWhatsappUrl(settings.whatsappNumber, message),
      total: Number(existing.total),
      reused: true,
    };
  }

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { additionalCategories: { select: { categoryId: true } } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  // Campaign prices are resolved fresh here, server-side, from current DB state — never
  // trust a client-submitted price. This is the same rule the rest of checkout already
  // follows for product existence (see module docstring above).
  const effectivePrices = await getEffectivePricesForProducts(
    products.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      brandId: p.brandId,
      price: toMoney(p.price.toString()),
      additionalCategoryIds: p.additionalCategories.map((c) => c.categoryId),
    }))
  );

  const lines = input.items.map((item) => {
    const product = productMap.get(item.productId);
    // Visibility controls storefront rendering only. A product already placed in a
    // customer's cart must not be rejected merely because a cached page predates an
    // admin visibility change; only a genuinely missing product blocks the order.
    if (!product) {
      throw new CheckoutError(`المنتج غير متوفر حالياً`, "items");
    }
    const unitPrice = effectivePrices.get(item.productId)?.finalPrice ?? toMoney(product.price.toString());
    return {
      product,
      quantity: item.quantity,
      unitPrice,
      lineTotal: toMoney(unitPrice * item.quantity),
    };
  });

  const subtotal = calculateSubtotal(lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })));

  let deliveryFee = 0;
  let deliveryLabel = "استلام من المتجر";
  if (input.deliveryKind === "DELIVERY") {
    if (!input.deliveryZoneId) throw new CheckoutError("يرجى اختيار منطقة التوصيل", "deliveryZoneId");
    const zone = await prisma.deliveryZone.findUnique({ where: { id: input.deliveryZoneId } });
    if (!zone || !zone.isActive) throw new CheckoutError("منطقة التوصيل غير متاحة", "deliveryZoneId");
    deliveryFee = toMoney(zone.fee.toString());
    deliveryLabel = zone.nameAr;
  }

  const totals = calculateOrderTotals({ subtotal, deliveryFee });

  let paymentLabel = "غير محدد";
  if (input.paymentMethodId) {
    const pm = await prisma.paymentMethod.findUnique({ where: { id: input.paymentMethodId } });
    if (pm) paymentLabel = pm.nameAr;
  }

  const settings = await getStoreSettings();

  let orderNumber = generateOrderNumber();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.order.findUnique({ where: { orderNumber } });
    if (!clash) break;
    orderNumber = generateOrderNumber();
  }

  const whatsappMessage = buildWhatsappMessage({
    orderNumber,
    items: lines.map((l) => ({
      name: l.product.nameAr,
      model: l.product.model,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
    deliveryLabel,
    paymentLabel,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    addressDetails: input.addressDetails,
    notes: input.customerNotes,
    template: settings.whatsappTemplate,
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      idempotencyKey: input.idempotencyKey,
      status: "PENDING_WHATSAPP",
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryKind: input.deliveryKind,
      deliveryZoneId: input.deliveryKind === "DELIVERY" ? input.deliveryZoneId || null : null,
      addressDetails: input.addressDetails,
      paymentMethodId: input.paymentMethodId || null,
      customerNotes: input.customerNotes,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      whatsappMessage,
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          nameSnapshot: l.product.nameAr,
          skuSnapshot: l.product.sku,
          priceSnapshot: l.unitPrice,
          quantity: l.quantity,
          lineTotal: l.lineTotal,
        })),
      },
      statusHistory: {
        create: { toStatus: "PENDING_WHATSAPP" },
      },
    },
  });

  return {
    orderNumber: order.orderNumber,
    whatsappUrl: buildWhatsappUrl(settings.whatsappNumber, whatsappMessage),
    total: totals.total,
    reused: false,
  };
}
