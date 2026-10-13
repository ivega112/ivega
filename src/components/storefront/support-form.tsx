"use client";

import { useState } from "react";
import { buildWhatsappUrl } from "@/lib/whatsapp";

const REQUEST_TYPES = [
  { value: "product", label: "استفسار عن منتج" },
  { value: "order", label: "استفسار عن طلب" },
  { value: "warranty", label: "ضمان / صيانة" },
  { value: "other", label: "أخرى" },
];

export function SupportForm({ whatsappNumber }: { whatsappNumber: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestType, setRequestType] = useState(REQUEST_TYPES[0]!.value);
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedPhone || !trimmedMessage) {
      setError("يرجى تعبئة الاسم ورقم الهاتف والرسالة قبل الإرسال");
      return;
    }

    const typeLabel = REQUEST_TYPES.find((t) => t.value === requestType)?.label ?? requestType;

    const lines = [
      "طلب دعم جديد من موقع Smart Line",
      "",
      `الاسم: ${trimmedName}`,
      `الهاتف: ${trimmedPhone}`,
      `نوع الطلب: ${typeLabel}`,
      reference.trim() ? `مرجع المنتج/الطلب: ${reference.trim()}` : null,
      "",
      `الرسالة: ${trimmedMessage}`,
    ].filter((line): line is string => line !== null);

    const url = buildWhatsappUrl(whatsappNumber, lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-[3px] border border-ay-line bg-white p-5">
      <h2 className="text-base font-semibold text-ay-title">نموذج تواصل سريع</h2>
      <p className="text-xs text-ay-muted">لا حاجة لإنشاء حساب — سيتم فتح واتساب برسالتك جاهزة للإرسال.</p>

      <label className="flex flex-col gap-1 text-sm text-ay-title">
        الاسم
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-11 rounded-[35px] border border-ay-line px-3 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ay-title">
        رقم الهاتف
        <input
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="h-11 rounded-[35px] border border-ay-line px-3 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ay-title">
        نوع الطلب
        <select
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="h-11 rounded-[35px] border border-ay-line px-3 text-sm"
        >
          {REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-ay-title">
        مرجع المنتج أو رقم الطلب (اختياري)
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="مثال: IV-K800 أو رقم الطلب"
          className="h-11 rounded-[35px] border border-ay-line px-3 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ay-title">
        الرسالة
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          className="rounded-[35px] border border-ay-line p-3 text-sm"
        />
      </label>

      {error && (
        <p role="alert" className="text-xs text-discount-ribbon">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="flex h-12 items-center justify-center gap-2 rounded-[35px] bg-ay-whatsapp text-sm font-semibold text-white hover:opacity-90"
      >
        إرسال عبر واتساب
      </button>
    </form>
  );
}
