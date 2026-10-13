"use client";

import { useActionState, useMemo, useState } from "react";
import { createCampaignAction, updateCampaignAction, type CampaignFormState } from "./actions";

interface Option {
  id: string;
  nameAr: string;
}

interface TargetProduct {
  id: string;
  nameAr: string;
  sku: string;
  price: number;
  imageUrl: string | null;
}

export interface CampaignFormInitial {
  id: string;
  nameAr: string;
  description: string;
  promoTextAr: string;
  badgeText: string;
  ctaLabel: string;
  ctaUrl: string;
  placements: string[];
  discountMode: "PERCENTAGE" | "FINAL_PRICE";
  discountPercentage: number | null;
  startsAtLocal: string;
  endsAtLocal: string;
  priority: number;
  showCountdown: boolean;
  isEnabled: boolean;
  productIds: string[];
  categoryIds: string[];
  brandIds: string[];
  bannerImageUrl: string | null;
  /** Only populated on the edit page — resolved from the campaign's already-saved
   * targeting. New/unsaved campaigns show a "save as draft first" notice instead of a
   * live final-price table, since resolving dynamic category/brand targeting needs a
   * server round-trip this form doesn't do client-side. */
  targetProducts?: TargetProduct[];
  existingFinalPrices?: Record<string, number>;
}

const PLACEMENTS: { value: string; label: string }[] = [
  { value: "HOMEPAGE_HERO", label: "الواجهة الرئيسية" },
  { value: "HOMEPAGE_SECTION", label: "قسم بالصفحة الرئيسية" },
  { value: "SHOP", label: "صفحة المتجر" },
  { value: "CATEGORY_PAGE", label: "صفحة القسم" },
  { value: "BRAND_PAGE", label: "صفحة الشركة" },
  { value: "PRODUCT_PAGE", label: "صفحة المنتج" },
  { value: "BANNER", label: "بانر ترويجي" },
];

const initialState: CampaignFormState = { ok: false };

export function CampaignForm({
  products,
  categories,
  brands,
  initial,
}: {
  products: Option[];
  categories: Option[];
  brands: Option[];
  initial?: CampaignFormInitial;
}) {
  const isEditing = Boolean(initial?.id);
  const action = isEditing ? updateCampaignAction.bind(null, initial!.id) : createCampaignAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [discountMode, setDiscountMode] = useState<"PERCENTAGE" | "FINAL_PRICE">(initial?.discountMode ?? "PERCENTAGE");
  const [finalPrices, setFinalPrices] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const [id, price] of Object.entries(initial?.existingFinalPrices ?? {})) map[id] = String(price);
    return map;
  });
  const [bulkPercent, setBulkPercent] = useState("");

  const targetProducts = initial?.targetProducts ?? [];

  function applyBulkPercent() {
    const pct = Number(bulkPercent);
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return;
    const next: Record<string, string> = { ...finalPrices };
    for (const p of targetProducts) {
      next[p.id] = (p.price * (1 - pct / 100)).toFixed(3);
    }
    setFinalPrices(next);
  }

  function clearAllPrices() {
    setFinalPrices({});
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Section title="معلومات الحملة الأساسية">
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم الحملة" required>
            <input name="nameAr" defaultValue={initial?.nameAr} required className="input" />
          </Field>
          <Field label="نص الشارة (اختياري)" help="مثال: خصم الصيف">
            <input name="badgeText" defaultValue={initial?.badgeText} className="input" />
          </Field>
        </div>
        <Field label="الوصف الداخلي (للإدارة فقط)">
          <textarea name="description" defaultValue={initial?.description} rows={2} className="input" />
        </Field>
        <Field label="النص الترويجي العام (يظهر للعملاء)">
          <textarea name="promoTextAr" defaultValue={initial?.promoTextAr} rows={2} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="نص زر الدعوة (CTA)">
            <input name="ctaLabel" defaultValue={initial?.ctaLabel} className="input" />
          </Field>
          <Field label="رابط الزر" help="مسار داخلي فقط، مثال: /shop?badge=OFFER">
            <input name="ctaUrl" defaultValue={initial?.ctaUrl} dir="ltr" className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="صورة البانر (سطح المكتب)">
            <input name="banner" type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="input" />
            {initial?.bannerImageUrl && <span className="admin-field-help">يوجد بانر محفوظ حالياً — اختر ملفاً جديداً لاستبداله</span>}
          </Field>
          <Field label="صورة البانر (موبايل، اختياري)">
            <input name="bannerMobile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="input" />
          </Field>
        </div>
      </Section>

      <Section title="الجدولة والأولوية">
        <div className="grid grid-cols-2 gap-3">
          <Field label="تاريخ ووقت البدء" required help="بتوقيت السيرفر">
            <input name="startsAt" type="datetime-local" defaultValue={initial?.startsAtLocal} required className="input" />
          </Field>
          <Field label="تاريخ ووقت الانتهاء" required help="بتوقيت السيرفر">
            <input name="endsAt" type="datetime-local" defaultValue={initial?.endsAtLocal} required className="input" />
          </Field>
          <Field label="الأولوية عند التعارض" help="رقم أعلى = أولوية أعلى عند تساوي السعر النهائي مع حملة أخرى">
            <input name="priority" type="number" step="1" defaultValue={initial?.priority ?? 0} className="input" />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="showCountdown" defaultChecked={initial?.showCountdown} /> إظهار عداد تنازلي
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isEnabled" defaultChecked={initial?.isEnabled} /> تفعيل الحملة (بدون هذا الخيار تبقى الحملة مسودة)
          </label>
        </div>
      </Section>

      <Section title="أماكن الظهور" help="اختر مكاناً واحداً على الأقل">
        <div className="flex flex-wrap gap-3">
          {PLACEMENTS.map((p) => (
            <label key={p.value} className="flex items-center gap-2 rounded-pill border border-border px-3 py-1.5 text-xs">
              <input type="checkbox" name="placements" value={p.value} defaultChecked={initial?.placements?.includes(p.value)} />
              {p.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="استهداف الحملة" help="اختر منتجات محددة و/أو أقسام كاملة و/أو شركات كاملة — يتم دمج الكل بدون تكرار">
        <Field label="منتجات محددة">
          <select name="productIds" multiple defaultValue={initial?.productIds ?? []} className="input h-32">
            {products.map((p) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="أقسام كاملة">
            <select name="categoryIds" multiple defaultValue={initial?.categoryIds ?? []} className="input h-28">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </Field>
          <Field label="شركات كاملة">
            <select name="brandIds" multiple defaultValue={initial?.brandIds ?? []} className="input h-28">
              {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="وضع الخصم">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="discountMode" value="PERCENTAGE" checked={discountMode === "PERCENTAGE"} onChange={() => setDiscountMode("PERCENTAGE")} />
            نسبة مئوية موحّدة
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="discountMode" value="FINAL_PRICE" checked={discountMode === "FINAL_PRICE"} onChange={() => setDiscountMode("FINAL_PRICE")} />
            سعر نهائي لكل منتج
          </label>
        </div>

        {discountMode === "PERCENTAGE" ? (
          <Field label="نسبة الخصم %" required help="بين 0 و100 — يُحسب السعر النهائي تلقائياً لكل منتج مستهدف عند العرض">
            <input name="discountPercentage" type="number" min="1" max="99" step="0.5" defaultValue={initial?.discountPercentage ?? ""} className="input w-40" />
          </Field>
        ) : !isEditing ? (
          <p className="admin-field-help">
            احفظ الحملة كمسودة أولاً (بدون تفعيل)، ثم افتحها للتعديل لتحديد السعر النهائي لكل منتج مستهدف — القائمة تُحسب من الاستهداف المحفوظ.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-text-secondary">
                تطبيق نسبة موحّدة على كل المنتجات المستهدفة حالياً
                <input value={bulkPercent} onChange={(e) => setBulkPercent(e.target.value)} type="number" min="1" max="99" placeholder="%" className="input w-28" />
              </label>
              <button type="button" onClick={applyBulkPercent} className="h-10 rounded-control border border-border px-3 text-xs font-semibold text-brand-action">تطبيق</button>
              <button type="button" onClick={clearAllPrices} className="h-10 rounded-control border border-border px-3 text-xs text-text-muted">مسح الكل</button>
            </div>
            {targetProducts.length === 0 ? (
              <p className="admin-field-help">لا توجد منتجات مستهدفة حالياً — أضف منتجات/أقسام/شركات بالأعلى ثم احفظ.</p>
            ) : (
              <div className="overflow-x-auto rounded-control border border-border-light">
                <table className="w-full text-sm">
                  <thead className="bg-bg-panel text-xs text-text-muted">
                    <tr>
                      <th className="p-2 text-start">المنتج</th>
                      <th className="p-2 text-start">SKU</th>
                      <th className="p-2 text-start">السعر الأصلي</th>
                      <th className="p-2 text-start">السعر النهائي</th>
                      <th className="p-2 text-start">نسبة الخصم</th>
                      <th className="p-2 text-start">التوفير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetProducts.map((p) => (
                      <FinalPriceRow
                        key={p.id}
                        product={p}
                        value={finalPrices[p.id] ?? ""}
                        onChange={(v) => setFinalPrices((prev) => ({ ...prev, [p.id]: v }))}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Section>

      {state.error && <p role="alert" className="admin-field-error text-sm">{state.error}</p>}

      <button type="submit" disabled={pending} className="h-11 w-fit rounded-control bg-brand-action px-6 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "جارٍ الحفظ…" : "حفظ الحملة"}
      </button>
    </form>
  );
}

function FinalPriceRow({
  product,
  value,
  onChange,
}: {
  product: TargetProduct;
  value: string;
  onChange: (v: string) => void;
}) {
  const finalPrice = Number(value);
  const valid = value !== "" && Number.isFinite(finalPrice) && finalPrice >= 0 && finalPrice < product.price;
  const invalid = value !== "" && !valid;
  const discountPercent = useMemo(() => {
    if (!valid) return null;
    return Math.round(((product.price - finalPrice) / product.price) * 10000) / 100;
  }, [valid, finalPrice, product.price]);

  return (
    <tr className="border-t border-border-light">
      <td className="p-2">{product.nameAr}</td>
      <td className="p-2 font-mono text-xs" dir="ltr">{product.sku}</td>
      <td className="p-2 font-mono">{product.price.toFixed(3)}</td>
      <td className="p-2">
        <input
          name={`finalPrice_${product.id}`}
          type="number"
          min="0"
          step="0.001"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid ? "true" : undefined}
          className="input h-9 w-28"
        />
        {invalid && <span className="admin-field-error">أقل من السعر الأصلي</span>}
      </td>
      <td className="p-2 font-mono">{discountPercent != null ? `${discountPercent}%` : "—"}</td>
      <td className="p-2 font-mono">{valid ? (product.price - finalPrice).toFixed(3) : "—"}</td>
    </tr>
  );
}

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-card border border-border bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-text-primary">{title}</legend>
      {help && <p className="-mt-2 text-xs text-text-faint">{help}</p>}
      {children}
    </fieldset>
  );
}

function Field({ label, children, required, help }: { label: string; children: React.ReactNode; required?: boolean; help?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-text-secondary">
      <span>
        {label}
        {required && <span aria-hidden="true" className="ms-0.5 text-discount-ribbon">*</span>}
      </span>
      {children}
      {help && <span className="admin-field-help">{help}</span>}
    </label>
  );
}
