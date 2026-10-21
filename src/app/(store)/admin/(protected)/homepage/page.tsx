import Image from "next/image";
import Link from "next/link";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import {
  toggleSectionAction,
  moveSectionAction,
  updateSectionAction,
  upsertHeroSlideAction,
  deleteHeroSlideAction,
  moveHeroSlideAction,
} from "./actions";

// Where each homepage section key appears in the storefront, shown next to the raw key.
const SECTION_HELP: Record<string, string> = {
  categories: "تسوّق حسب القسم — تظهر كل الأقسام الظاهرة، والترتيب من صفحة الأقسام",
  featured_products: "تبويبات المنتجات (مميزة / وصل حديثاً / الأكثر مبيعاً / العروض) — الرقم = عدد المنتجات",
  campaigns: "بطاقات الحملات مع العد التنازلي",
  reviews: "آراء العملاء — الرقم = عدد التقييمات",
};

export default async function AdminHomepagePage() {
  await requireAdmin();
  const [sections, heroSlides] = await Promise.all([
    prisma.homepageSection.findMany({ where: { key: { not: "banners" } }, orderBy: { displayOrder: "asc" } }),
    prisma.heroSlide.findMany({ where: { isArchived: false }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] }),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">بناء الصفحة الرئيسية</h1>
        <Link href="/" target="_blank" className="text-sm font-semibold text-brand-action">معاينة الرئيسية ↗</Link>
      </div>

      <section className="rounded-card border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">أقسام الصفحة الرئيسية</h2>
        <div className="flex flex-col gap-3">
          {sections.map((s, i) => (
            <div key={s.id} className="rounded-control border border-border-light p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="flex gap-1">
                  <form action={moveSectionAction.bind(null, s.id, "up")}>
                    <button type="submit" disabled={i === 0} aria-label="نقل لأعلى" className="h-7 w-7 rounded border border-border text-xs disabled:opacity-30">↑</button>
                  </form>
                  <form action={moveSectionAction.bind(null, s.id, "down")}>
                    <button type="submit" disabled={i === sections.length - 1} aria-label="نقل لأسفل" className="h-7 w-7 rounded border border-border text-xs disabled:opacity-30">↓</button>
                  </form>
                </div>
                <span className="font-mono text-xs text-text-faint">{s.key}</span>
                {SECTION_HELP[s.key] && <span className="text-xs text-text-secondary">— {SECTION_HELP[s.key]}</span>}
                <form action={toggleSectionAction.bind(null, s.id)} className="ms-auto">
                  <button type="submit" className={`rounded-pill px-3 py-1 text-xs font-semibold ${s.isEnabled ? "bg-success-bg text-stock-in-text" : "bg-bg-panel text-text-faint"}`}>
                    {s.isEnabled ? "مفعّل" : "معطّل"}
                  </button>
                </form>
              </div>
              <form action={updateSectionAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={s.id} />
                <input name="titleAr" defaultValue={s.titleAr} className="input flex-1" />
                <input name="subtitleAr" defaultValue={s.subtitleAr ?? ""} placeholder="عنوان فرعي" className="input flex-1" />
                {(s.key === "featured_products" || s.key === "reviews") && (
                  <input
                    name="limit"
                    type="number"
                    min={1}
                    max={24}
                    defaultValue={(s.config as { limit?: number } | null)?.limit ?? 8}
                    className="input w-20"
                  />
                )}
                <button type="submit" className="h-9 rounded-control bg-brand-deep px-3 text-xs font-semibold text-white">حفظ</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-border bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">شرائح السلايدر الرئيسي</h2>
        <p className="mb-4 text-xs leading-6 text-text-faint">
          أضف صوراً ثابتة أو متحركة أو فيديوهات، ثم رتّبها بالأسهم. تتبدّل الإعلانات تلقائياً كل 5 ثوانٍ، والصورة أو الفيديو غير قابلين للنقر.
          المقاس المناسب 1800×700 بكسل تقريباً.
        </p>
        <div className="mb-4 flex flex-col gap-2">
          {heroSlides.map((h, i) => (
            <div key={h.id} className="rounded-control border border-border-light p-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="relative grid h-12 w-36 flex-none place-items-center overflow-hidden rounded-[6px] bg-bg-subtle text-[11px] text-text-faint">
                  {h.mediaType === "VIDEO" ? "فيديو" : h.imageUrl ? <Image src={h.imageUrl} alt="" fill sizes="144px" className="object-cover" /> : "صورة"}
                </span>
                <span className="font-semibold">{h.mediaType === "VIDEO" ? "فيديو إعلاني" : "صورة إعلانية"}</span>
                <div className="ms-auto flex items-center gap-2">
                  <form action={moveHeroSlideAction.bind(null, h.id, "up")}>
                    <button type="submit" disabled={i === 0} aria-label="تحريك لأعلى" className="h-7 w-7 rounded border border-border disabled:opacity-30">
                      ↑
                    </button>
                  </form>
                  <form action={moveHeroSlideAction.bind(null, h.id, "down")}>
                    <button type="submit" disabled={i === heroSlides.length - 1} aria-label="تحريك لأسفل" className="h-7 w-7 rounded border border-border disabled:opacity-30">
                      ↓
                    </button>
                  </form>
                  <form action={deleteHeroSlideAction.bind(null, h.id)}>
                    <ConfirmSubmitButton message="حذف هذا الإعلان نهائياً؟" className="text-xs text-discount-ribbon">
                      حذف
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {heroSlides.length === 0 && <span className="text-xs text-text-faint">لا توجد شرائح بعد</span>}
        </div>

        <form action={upsertHeroSlideAction} className="flex flex-col gap-3 border-t border-border-light pt-4">
          <span className="text-xs font-semibold text-text-primary">إضافة إعلان جديد</span>
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            صورة أو فيديو (حتى 80MB للفيديو)
            <input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif,video/mp4,video/webm" required className="input" />
          </label>
          <button type="submit" className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white">
            إضافة الإعلان
          </button>
        </form>
      </section>

    </div>
  );
}
