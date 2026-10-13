"use server";

import { createOrderFromCheckout, CheckoutError } from "@/lib/checkout";
import { checkoutSchema } from "@/lib/validation";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";

export interface CheckoutActionState {
  ok: boolean;
  error?: string;
  field?: string;
  orderNumber?: string;
  whatsappUrl?: string;
}

export async function submitCheckout(rawInput: unknown): Promise<CheckoutActionState> {
  const parsed = checkoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    // Public, unauthenticated, DB-writing endpoint — cap per-IP order creation to a
    // generous rate no real customer would hit, closing off automated order-spam abuse.
    await enforceRateLimit("checkout", { windowMs: 10 * 60 * 1000, max: 10 });
    const result = await createOrderFromCheckout(parsed.data);
    return { ok: true, orderNumber: result.orderNumber, whatsappUrl: result.whatsappUrl };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: err.message };
    }
    if (err instanceof CheckoutError) {
      return { ok: false, error: err.message, field: err.field };
    }
    return { ok: false, error: "تعذّر إتمام الطلب، يرجى المحاولة مرة أخرى" };
  }
}
