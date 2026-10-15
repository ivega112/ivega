"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "./cart-context";
import { calculateOrderTotals, calculateSubtotal, formatCurrency } from "@/lib/pricing";
import { submitCheckout } from "@/app/(store)/(storefront)/checkout/actions";
import type { ProductCardData } from "./product-card";

const formSchema = z.object({
  customerName: z.string().trim().min(2, "الاسم مطلوب"),
  customerPhone: z.string().trim().regex(/^(\+?962|0)?7[789]\d{7}$/, "رقم هاتف أردني غير صالح"),
  deliveryKind: z.enum(["DELIVERY", "PICKUP"]),
  deliveryZoneId: z.string().optional(),
  addressDetails: z.string().optional(),
  paymentMethodId: z.string().optional(),
  customerNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DeliveryZone {
  id: string;
  nameAr: string;
  fee: number;
  kind: "DELIVERY" | "PICKUP";
}
interface PaymentMethod {
  id: string;
  nameAr: string;
  description: string | null;
}

export function CheckoutReviewClient() {
  const { lines, clearCart, keepOnlyProducts } = useCart();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderNumber: string; whatsappUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { deliveryKind: "DELIVERY" },
  });

  const deliveryKind = watch("deliveryKind");
  const deliveryZoneId = watch("deliveryZoneId");

  useEffect(() => {
    if (lines.length > 0) {
      fetch(`/api/catalog/by-ids?ids=${lines.map((l) => l.productId).join(",")}`)
        .then((r) => r.json())
        .then((d) => {
          const availableProducts = d.products ?? [];
          setProducts(availableProducts);
          // Cart storage survives deployments. Remove only IDs the active catalog no
          // longer recognizes, preventing an old cart entry from blocking checkout.
          keepOnlyProducts(availableProducts.map((product: ProductCardData) => product.id));
        });
    }
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => {
        setZones(d.deliveryZones);
        setPayments(d.paymentMethods);
      });
  }, [lines, keepOnlyProducts]);

  const subtotal = useMemo(() => {
    const cartLines = lines
      .map((l) => {
        const p = products.find((pr) => pr.id === l.productId);
        return p ? { unitPrice: p.price, quantity: l.quantity } : null;
      })
      .filter((l): l is { unitPrice: number; quantity: number } => Boolean(l));
    return calculateSubtotal(cartLines);
  }, [lines, products]);

  const selectedZone = zones.find((z) => z.id === deliveryZoneId);
  const totals = calculateOrderTotals({ subtotal, deliveryFee: deliveryKind === "DELIVERY" ? selectedZone?.fee ?? 0 : 0 });

  async function onSubmit(values: FormValues) {
    // Avoid submitting while the current catalog lookup is still catching up with a
    // just-added item. The server receives only product IDs it can resolve.
    const availableIds = new Set(products.map((product) => product.id));
    const orderLines = lines.filter((line) => availableIds.has(line.productId));
    if (orderLines.length === 0 || orderLines.length !== lines.length) {
      setError("تم تحديث السلة، يرجى إرسال الطلب مرة أخرى.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await submitCheckout({
      items: orderLines,
      ...values,
      idempotencyKey,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "حدث خطأ");
      return;
    }
    setResult({ orderNumber: res.orderNumber!, whatsappUrl: res.whatsappUrl! });
    clearCart();
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[3px] border border-success-border bg-success-bg py-12 text-center">
        <span className="text-lg font-bold text-ay-title">تم إنشاء طلبك رقم {result.orderNumber}</span>
        <p className="max-w-md text-sm text-ay-text">أكمل إرسال الطلب عبر واتساب لتأكيده مع فريق المتجر.</p>
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-13 items-center gap-2 rounded-[35px] bg-ay-whatsapp px-6 text-sm font-bold text-white hover:opacity-90"
        >
          إرسال الطلب عبر واتساب
        </a>
      </div>
    );
  }

  if (lines.length === 0) {
    return <div className="rounded-[3px] bg-ay-page py-16 text-center text-sm text-ay-text">السلة فارغة</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="rounded-[3px] border border-ay-line bg-white p-4">
          <label htmlFor="customerName" className="mb-1 block text-sm font-medium text-ay-title">الاسم الكامل</label>
          <input id="customerName" {...register("customerName")} className="h-11 w-full rounded-[35px] border border-ay-line px-3 text-sm" />
          {errors.customerName && <p role="alert" className="mt-1 text-xs text-discount-ribbon">{errors.customerName.message}</p>}
        </div>

        <div className="rounded-[3px] border border-ay-line bg-white p-4">
          <label htmlFor="customerPhone" className="mb-1 block text-sm font-medium text-ay-title">رقم الهاتف</label>
          <input id="customerPhone" dir="ltr" {...register("customerPhone")} className="h-11 w-full rounded-[35px] border border-ay-line px-3 text-sm" />
          {errors.customerPhone && <p role="alert" className="mt-1 text-xs text-discount-ribbon">{errors.customerPhone.message}</p>}
        </div>

        <div className="rounded-[3px] border border-ay-line bg-white p-4">
          <span className="mb-2 block text-sm font-medium text-ay-title">طريقة الاستلام</span>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="DELIVERY" {...register("deliveryKind")} /> توصيل
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="PICKUP" {...register("deliveryKind")} /> استلام من المتجر
            </label>
          </div>

          {deliveryKind === "DELIVERY" && (
            <div className="mt-3">
              <select {...register("deliveryZoneId")} className="h-11 w-full rounded-[35px] border border-ay-line px-3 text-sm">
                <option value="">اختر منطقة التوصيل</option>
                {zones
                  .filter((z) => z.kind === "DELIVERY")
                  .map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nameAr} — {formatCurrency(z.fee)}
                    </option>
                  ))}
              </select>
              <textarea
                {...register("addressDetails")}
                placeholder="تفاصيل العنوان"
                className="mt-2 w-full rounded-[12px] border border-ay-line p-3 text-sm"
                rows={2}
              />
            </div>
          )}
        </div>

        <div className="rounded-[3px] border border-ay-line bg-white p-4">
          <span className="mb-2 block text-sm font-medium text-ay-title">طريقة الدفع</span>
          <select {...register("paymentMethodId")} className="h-11 w-full rounded-[35px] border border-ay-line px-3 text-sm">
            <option value="">اختر طريقة الدفع</option>
            {payments.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameAr}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-[3px] border border-ay-line bg-white p-4">
          <label htmlFor="customerNotes" className="mb-1 block text-sm font-medium text-ay-title">ملاحظات (اختياري)</label>
          <textarea id="customerNotes" {...register("customerNotes")} className="w-full rounded-[12px] border border-ay-line p-3 text-sm" rows={2} />
        </div>
      </div>

      <section aria-label="ملخص الطلب" className="h-fit rounded-[3px] border border-ay-line bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <span>الإجمالي الفرعي</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>التوصيل</span>
          <span>{formatCurrency(totals.deliveryFee)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-ay-line pt-2 text-base font-bold">
          <span>الإجمالي التقديري</span>
          <span className="text-ay-heading">{formatCurrency(totals.total)}</span>
        </div>
        {error && <p role="alert" className="mt-3 text-xs text-discount-ribbon">{error}</p>}
        <button
          type="submit"
          disabled={submitting || products.length !== lines.length}
          className="mt-4 flex h-13 w-full items-center justify-center rounded-[35px] bg-ay-whatsapp text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "جارٍ الإرسال…" : "إرسال الطلب عبر واتساب"}
        </button>
      </section>
    </form>
  );
}
