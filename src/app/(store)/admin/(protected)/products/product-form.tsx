"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction, deleteProductImageAction, setPrimaryProductImageAction } from "./actions";
import { buildSlugBase, isValidSlug } from "@/lib/slug";

interface Option {
  id: string;
  nameAr: string;
}

interface ProductFormValues {
  id?: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
  sku: string;
  model?: string;
  categoryId: string;
  brandId: string;
  shortSpec: string;
  description: string;
  price: number;
  oldPrice: number | null;
  quantity: number;
  lowStockThreshold: number;
  badge: string;
  isVisible: boolean;
  isFeatured: boolean;
  isNew: boolean;
  warrantyInfo?: string;
  supportInfo?: string;
  additionalCategoryIds?: string[];
  seoTitle?: string;
  seoDescription?: string;
  images?: { id: string; url: string; isPrimary: boolean }[];
}

const BADGES = [
  { value: "NONE", label: "بدون" },
  { value: "NEW", label: "جديد" },
  { value: "OFFER", label: "عرض" },
  { value: "HOT", label: "الأكثر مبيعاً" },
  { value: "PICK", label: "مميّز" },
  { value: "LOW", label: "كمية محدودة" },
  { value: "OUT", label: "غير متوفر" },
];

export function ProductForm({
  categories,
  brands,
  initial,
}: {
  categories: Option[];
  brands: Option[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Live slug preview (create-only): derived from the name fields as the admin types,
  // exactly mirroring the server's own fallback logic (src/lib/slug.ts) so what's
  // previewed here is what actually gets saved when no manual override is given.
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [manualSlug, setManualSlug] = useState("");

  const previewSlug = useMemo(() => buildSlugBase({ nameAr, nameEn, model }), [nameAr, nameEn, model]);
  const manualSlugError = manualSlug && !isValidSlug(manualSlug) ? "الرابط يجب أن يحتوي أحرف لاتينية صغيرة وأرقام وشرطات فقط" : null;

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    // Manual slug override only ever applies on create — updateProductAction ignores the
    // field entirely regardless, but drop it from the submitted data too for clarity.
    if (isEditing || !manualSlug) formData.delete("slug");

    const action = initial?.id ? updateProductAction.bind(null, initial.id) : createProductAction;
    const res = await action(formData);
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? "خطأ");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {/* Existing images gallery lives OUTSIDE the main form below — its own per-image
          delete/set-primary actions are each a separate <form>, and nested <form> elements
          aren't valid HTML (the browser silently mangles them). */}
      {isEditing && initial?.images && initial.images.length > 0 && (
        <Section title="الصور الحالية">
          <div className="flex flex-wrap gap-3">
            {initial.images.map((img) => (
              <div key={img.id} className="flex w-24 flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnail, not worth next/image's overhead here */}
                <img src={img.url} alt="" className="h-24 w-24 rounded-control border border-border object-contain" />
                {img.isPrimary ? (
                  <span className="rounded-pill bg-brand-action-tint px-2 py-0.5 text-[10px] font-semibold text-brand-deep">الرئيسية</span>
                ) : (
                  <form action={setPrimaryProductImageAction.bind(null, img.id)}>
                    <button type="submit" className="text-[10px] text-brand-action">اجعلها رئيسية</button>
                  </form>
                )}
                <form action={deleteProductImageAction.bind(null, img.id)}>
                  <button type="submit" className="text-[10px] text-discount-ribbon">حذف</button>
                </form>
              </div>
            ))}
          </div>
        </Section>
      )}

    <form action={onSubmit} className="flex flex-col gap-6">
      {/* 1. Basic information */}
      <Section title="المعلومات الأساسية">
        <div className="grid grid-cols-2 gap-3">
          <Field label="الاسم بالعربي" required>
            <input name="nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} required className="input" />
          </Field>
          <Field label="الاسم بالإنجليزي" help="يُستخدم أيضاً لتوليد الرابط (slug) تلقائياً">
            <input name="nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" className="input" />
          </Field>
          <Field label="الموديل">
            <input name="model" value={model} onChange={(e) => setModel(e.target.value)} dir="ltr" className="input" />
          </Field>
          <Field label="SKU">
            {isEditing ? (
              <input value={initial?.sku ?? ""} disabled readOnly dir="ltr" className="input" aria-readonly="true" />
            ) : (
              <input value="سيتم إنشاء SKU تلقائياً عند حفظ المنتج" disabled readOnly className="input" />
            )}
          </Field>
        </div>

        {/* Slug: locked read-only display after creation (renaming the product later must
            not silently break the existing public URL); live preview + optional manual
            override only while creating. */}
        {isEditing ? (
          <Field label="الرابط (slug)" help="الرابط ثابت بعد الإنشاء لحماية الروابط المنشورة من الانكسار">
            <input value={initial?.slug ?? ""} disabled readOnly dir="ltr" className="input" aria-readonly="true" />
          </Field>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-text-secondary">
              الرابط (slug) <span className="font-mono text-xs text-text-faint" dir="ltr">/product/{manualSlug || previewSlug || "…"}</span>
            </span>
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-fit text-xs font-semibold text-brand-action"
            >
              {advancedOpen ? "إخفاء الخيارات المتقدمة" : "خيارات متقدمة: تعديل الرابط يدوياً"}
            </button>
            {advancedOpen && (
              <div>
                <input
                  name="slug"
                  value={manualSlug}
                  onChange={(e) => setManualSlug(e.target.value)}
                  placeholder={previewSlug}
                  dir="ltr"
                  aria-invalid={manualSlugError ? "true" : undefined}
                  className="input"
                />
                {manualSlugError ? (
                  <span role="alert" className="admin-field-error">{manualSlugError}</span>
                ) : (
                  <span className="admin-field-help">اتركه فارغاً لاستخدام الرابط المُولَّد تلقائياً من الاسم أعلاه</span>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* 2. Category and company */}
      <Section title="القسم والشركة">
        <div className="grid grid-cols-2 gap-3">
          <Field label="القسم الأساسي" required>
            <select name="categoryId" defaultValue={initial?.categoryId} required className="input">
              <option value="">اختر</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </Field>
          <Field label="الشركة" required>
            <select name="brandId" defaultValue={initial?.brandId} required className="input">
              <option value="">اختر</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
            </select>
          </Field>
          <Field label="الشارة">
            <select name="badge" defaultValue={initial?.badge ?? "NONE"} className="input">
              {BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="أقسام إضافية" help="يظهر المنتج فيها أيضاً بالإضافة للقسم الأساسي — اختياري، تعدد اختيار">
          <select name="additionalCategoryIds" multiple defaultValue={initial?.additionalCategoryIds ?? []} className="input h-32">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
        </Field>
      </Section>

      {/* 3. Pricing */}
      <Section title="التسعير">
        <div className="grid grid-cols-2 gap-3">
          <Field label="السعر (د.أ)" required>
            <input name="price" type="number" step="0.001" min="0.001" defaultValue={initial?.price} required className="input" />
          </Field>
          <Field label="السعر قبل الخصم (د.أ)" help="اختياري — يجب أن يكون أعلى من السعر الحالي">
            <input name="oldPrice" type="number" step="0.001" min="0" defaultValue={initial?.oldPrice ?? ""} className="input" />
          </Field>
        </div>
      </Section>

      {/* 4. Inventory */}
      <Section title="المخزون">
        <div className="grid grid-cols-2 gap-3">
          <Field label="الكمية" required>
            <input name="quantity" type="number" min="0" step="1" defaultValue={initial?.quantity ?? 0} required className="input" />
          </Field>
          <Field label="حد التنبيه بالمخزون المنخفض">
            <input name="lowStockThreshold" type="number" min="0" step="1" defaultValue={initial?.lowStockThreshold ?? 5} className="input" />
          </Field>
        </div>
      </Section>

      {/* 5. Specifications & description */}
      <Section title="المواصفات والوصف">
        <Field label="المواصفات المختصرة">
          <input name="shortSpec" defaultValue={initial?.shortSpec} className="input" />
        </Field>
        <Field label="الوصف التفصيلي">
          <textarea name="description" defaultValue={initial?.description} rows={4} className="input" />
        </Field>
        <Field label="معلومات الضمان">
          <input name="warrantyInfo" defaultValue={initial?.warrantyInfo} className="input" />
        </Field>
      </Section>

      {/* 6. Media */}
      <Section title="صور المنتج">
        <Field label={isEditing ? "إضافة صور جديدة" : "صور المنتج"} help="يمكن اختيار أكثر من صورة دفعة واحدة">
          <input name="images" type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif" className="input" />
        </Field>
      </Section>

      {/* 7. SEO (اختياري) */}
      <Section title="تحسين محركات البحث (SEO)" help="اختياري — إن تُرك فارغاً يُستخدم اسم المنتج ومواصفاته المختصرة بدلاً منه">
        <Field label="عنوان الصفحة (SEO)">
          <input name="seoTitle" defaultValue={initial?.seoTitle} className="input" />
        </Field>
        <Field label="وصف الصفحة (SEO)">
          <textarea name="seoDescription" defaultValue={initial?.seoDescription} rows={2} className="input" />
        </Field>
      </Section>

      {/* 8. Visibility */}
      <Section title="الظهور">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isVisible" defaultChecked={initial?.isVisible ?? true} /> منشور</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} /> مميز</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isNew" defaultChecked={initial?.isNew} /> إظهاره في «جديدنا»</label>
        </div>
      </Section>

      {error && <p role="alert" className="admin-field-error text-sm">{error}</p>}

      <button
        type="submit"
        disabled={pending || Boolean(manualSlugError)}
        className="h-11 w-fit rounded-control bg-brand-action px-6 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "جارٍ الحفظ…" : "حفظ"}
      </button>
    </form>
    </div>
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
