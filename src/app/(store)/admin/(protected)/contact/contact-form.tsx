"use client";

import { useActionState } from "react";
import { updateContactSettingsAction, type ContactSettingsState } from "./actions";

const initialState: ContactSettingsState = { ok: false };

export function ContactForm({
  initial,
}: {
  initial: { contactPhoneDisplay: string; contactPhoneInternational: string; addressAr: string; mapEmbedUrl: string; mapsUrl: string };
}) {
  const [state, formAction, pending] = useActionState(updateContactSettingsAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card border border-border bg-white p-5">
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        رقم الهاتف المعروض
        <input name="contactPhoneDisplay" defaultValue={initial.contactPhoneDisplay} dir="ltr" required className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        رقم الهاتف الدولي
        <input name="contactPhoneInternational" defaultValue={initial.contactPhoneInternational} dir="ltr" required className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        العنوان
        <textarea name="addressAr" defaultValue={initial.addressAr} rows={2} required className="input" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        رابط موقع المتجر على الخريطة
        <input name="mapsUrl" defaultValue={initial.mapsUrl} dir="ltr" placeholder="https://maps.app.goo.gl/..." className="input" />
        <span className="text-xs text-text-faint">يفتح عند الضغط على العنوان في الفوتر وفي قائمة &quot;تواصل معنا&quot;.</span>
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        رابط الخريطة (Embed URL)
        <input name="mapEmbedUrl" defaultValue={initial.mapEmbedUrl} dir="ltr" className="input" />
        <span className="text-xs text-text-faint">خريطة Google مضمّنة تظهر في صفحة الدعم (من Google Maps ← مشاركة ← تضمين خريطة ← انسخ رابط src).</span>
      </label>

      {state.error && <p role="alert" className="text-sm text-discount-ribbon">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-stock-in-text">تم الحفظ بنجاح</p>}

      <button type="submit" disabled={pending} className="h-11 w-fit rounded-control bg-brand-action px-6 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "جارٍ الحفظ…" : "حفظ"}
      </button>

    </form>
  );
}
