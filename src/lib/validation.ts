import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  // Upper bound is defense-in-depth against a crafted request (not the real cart UI, which
  // never produces this many lines) forcing an oversized DB write / product lookup.
  items: z.array(cartLineSchema).min(1, "السلة فارغة").max(50, "عدد كبير جداً من المنتجات في الطلب"),
  customerName: z.string().trim().min(2, "الاسم مطلوب").max(120),
  customerPhone: z
    .string()
    .trim()
    .regex(/^(\+?962|0)?7[789]\d{7}$/, "رقم هاتف أردني غير صالح"),
  deliveryKind: z.enum(["DELIVERY", "PICKUP"]),
  deliveryZoneId: z.string().optional(),
  addressDetails: z.string().trim().max(500).optional(),
  paymentMethodId: z.string().optional(),
  customerNotes: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().uuid(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productFormSchema = z.object({
  nameAr: z.string().trim().min(2),
  nameEn: z.string().trim().optional(),
  // Slug and SKU are never trusted from the client as final values:
  // - `sku` isn't in this schema at all — it's generated server-side (src/lib/sku.ts) and
  //   the create/update actions never read it from formData, so no client input can reach it.
  // - `slug` here is only the *optional manual override* offered pre-creation (advanced
  //   option); when omitted, the server derives it from the name (src/lib/slug.ts). On
  //   update it is ignored entirely — slugs are immutable after creation.
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "slug يجب أن يحتوي أحرف لاتينية صغيرة وأرقام وشرطات فقط")
    .max(80)
    .optional()
    .or(z.literal("")),
  model: z.string().trim().optional(),
  categoryId: z.string().min(1),
  brandId: z.string().min(1),
  shortSpec: z.string().trim().optional(),
  description: z.string().trim().optional(),
  searchKeywords: z.string().trim().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  price: z.number().positive(),
  oldPrice: z.number().positive().optional().nullable(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  badge: z.enum(["NONE", "OFFER", "HOT", "NEW", "LOW", "OUT", "PICK"]).default("NONE"),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  warrantyInfo: z.string().trim().optional(),
  supportInfo: z.string().trim().optional(),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  // Upper bound rejects absurdly-long input before it ever reaches argon2 hashing (a crafted
  // multi-megabyte "password" would otherwise waste real server CPU/memory per request on an
  // unauthenticated, public endpoint).
  password: z.string().min(1).max(200),
});
