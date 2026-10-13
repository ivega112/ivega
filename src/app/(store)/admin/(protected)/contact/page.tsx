import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/auth/guard";
import { ContactForm } from "./contact-form";
import { upsertSocialLinkAction, deleteSocialLinkAction, updateOpeningHourAction } from "./actions";

const DAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default async function AdminContactPage() {
  await requireAdmin();
  const [settings, socialLinks, hours] = await Promise.all([
    getStoreSettings(),
    prisma.socialLink.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.openingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">التواصل وبيانات المتجر</h1>

      <ContactForm
        initial={{
          contactPhoneDisplay: settings.contactPhoneDisplay,
          contactPhoneInternational: settings.contactPhoneInternational,
          addressAr: settings.addressAr,
          mapEmbedUrl: settings.mapEmbedUrl,
          mapsUrl: settings.mapsUrl,
        }}
      />

      <section className="rounded-card border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">ساعات العمل</h2>
        <div className="flex flex-col gap-2">
          {hours.map((h) => (
            <form key={h.id} action={updateOpeningHourAction} className="flex flex-wrap items-center gap-2 text-sm">
              <input type="hidden" name="id" value={h.id} />
              <span className="w-20">{DAY_LABELS[h.dayOfWeek]}</span>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" name="isClosed" defaultChecked={h.isClosed} /> مغلق
              </label>
              <input type="time" name="opensAt" defaultValue={h.opensAt ?? ""} className="input w-28" />
              <span>—</span>
              <input type="time" name="closesAt" defaultValue={h.closesAt ?? ""} className="input w-28" />
              <button type="submit" className="rounded-control bg-brand-deep px-3 py-1.5 text-xs font-semibold text-white">حفظ</button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">روابط التواصل الاجتماعي</h2>
        <div className="mb-3 flex flex-col gap-2">
          {socialLinks.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span>{s.platform}</span>
              <span dir="ltr" className="truncate text-xs text-text-muted">{s.url}</span>
              <form action={deleteSocialLinkAction.bind(null, s.id)}>
                <button type="submit" className="text-xs text-discount-ribbon">حذف</button>
              </form>
            </div>
          ))}
          {socialLinks.length === 0 && <span className="text-xs text-text-faint">لا توجد روابط بعد</span>}
        </div>
        <form action={upsertSocialLinkAction} className="flex gap-2">
          <input name="platform" placeholder="المنصة (مثال: Instagram)" required className="input flex-1" />
          <input name="url" placeholder="الرابط" dir="ltr" required className="input flex-1" />
          <button type="submit" className="h-10 rounded-control bg-brand-deep px-4 text-sm font-semibold text-white">إضافة</button>
        </form>
      </section>

    </div>
  );
}
