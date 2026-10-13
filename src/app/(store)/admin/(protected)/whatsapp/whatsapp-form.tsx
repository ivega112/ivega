"use client";

import { useMemo, useState } from "react";
import { updateWhatsappSettingsAction } from "./actions";

const SAMPLE_MESSAGE_VARS: Record<string, string> = {
  orderNumber: "IV-260801-A1B2",
  itemsList: "1. رسيفر Smart Line HYPER K800 5G (IV-K800) × 1 = 42.00 د.أ",
  subtotal: "42.00",
  discountTotal: "0.00",
  deliveryFee: "3.00",
  total: "45.00",
  deliveryLabel: "عمّان",
  paymentLabel: "الدفع عند الاستلام",
  customerName: "أحمد محمد",
  customerPhone: "0791234567",
  addressDetails: "شارع الملكة رانيا، مبنى 12",
  notes: "—",
  currency: "د.أ",
};

const LOCATIONS = [
  { value: "header", label: "الهيدر" },
  { value: "footer", label: "الفوتر" },
  { value: "product", label: "صفحة المنتج" },
  { value: "floating", label: "الزر العائم" },
  { value: "contact", label: "صفحة التواصل" },
  { value: "support", label: "صفحة الدعم" },
];

function renderPreview(template: string): string {
  const fallback = `طلب جديد #{{orderNumber}}\n\n{{itemsList}}\n\nالإجمالي التقديري: {{total}} {{currency}}\n\nالاسم: {{customerName}}`;
  const source = template.trim() || fallback;
  return source.replace(/\{\{(\w+)\}\}/g, (_, key: string) => SAMPLE_MESSAGE_VARS[key] ?? `{{${key}}}`);
}

export function WhatsappForm({
  initial,
}: {
  initial: {
    whatsappNumber: string;
    whatsappDisplayNumber: string;
    whatsappTemplate: string;
    whatsappQuickReplies: string[];
    whatsappButtonLocations: string[];
  };
}) {
  const [template, setTemplate] = useState(initial.whatsappTemplate);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const preview = useMemo(() => renderPreview(template), [template]);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(false);
    const res = await updateWhatsappSettingsAction(formData);
    setPending(false);
    if (!res.ok) setError(res.error ?? "خطأ");
    else setSuccess(true);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <form action={onSubmit} className="flex flex-col gap-3 rounded-card border border-border bg-white p-5">
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          الرقم الدولي (بدون +)
          <input name="whatsappNumber" defaultValue={initial.whatsappNumber} dir="ltr" required className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          الرقم المعروض للعملاء
          <input name="whatsappDisplayNumber" defaultValue={initial.whatsappDisplayNumber} dir="ltr" required className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          قالب رسالة الطلب
          <textarea
            name="whatsappTemplate"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={8}
            className="input font-mono text-xs"
            dir="ltr"
          />
        </label>
        <p className="text-[11px] text-text-faint">
          المتغيرات المتاحة: {"{{orderNumber}} {{itemsList}} {{subtotal}} {{discountTotal}} {{deliveryFee}} {{total}} {{deliveryLabel}} {{paymentLabel}} {{customerName}} {{customerPhone}} {{addressDetails}} {{notes}} {{currency}}"}
        </p>

        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          ردود سريعة (سطر لكل رد)
          <textarea name="whatsappQuickReplies" defaultValue={initial.whatsappQuickReplies.join("\n")} rows={3} className="input" />
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm text-text-secondary">أماكن ظهور زر واتساب</legend>
          <div className="flex flex-wrap gap-3">
            {LOCATIONS.map((loc) => (
              <label key={loc.value} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  name="whatsappButtonLocations"
                  value={loc.value}
                  defaultChecked={initial.whatsappButtonLocations.includes(loc.value)}
                />
                {loc.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="text-sm text-discount-ribbon">{error}</p>}
        {success && <p role="status" className="text-sm text-stock-in-text">تم الحفظ بنجاح</p>}

        <button type="submit" disabled={pending} className="h-11 w-fit rounded-control bg-brand-action px-6 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </button>
      </form>

      <div className="h-fit rounded-card border border-[#14375f] bg-[#0b1f38] p-4">
        <span className="mb-2 block text-xs font-semibold text-[#cfe3fa]">معاينة الرسالة</span>
        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[#cfe3fa]">{preview}</pre>
      </div>

    </div>
  );
}
