import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { upsertFaqAction, toggleFaqVisibilityAction, deleteFaqAction, moveFaqAction } from "./actions";

export default async function AdminFaqPage() {
  await requireAdmin();
  const items = await prisma.faqItem.findMany({ orderBy: { displayOrder: "asc" } });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">الأسئلة الشائعة</h1>

      {items.length === 0 ? (
        <div className="rounded-card border border-border bg-bg-panel p-6 text-center text-sm text-text-muted">لا توجد أسئلة بعد</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={item.id} className="rounded-card border border-border bg-white p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.questionAr}</p>
                  <p className="mt-1 text-xs text-text-muted">{item.answerAr}</p>
                  {item.category && <span className="mt-1 inline-block rounded-pill bg-bg-panel px-2 py-0.5 text-[10px] text-text-faint">{item.category}</span>}
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <div className="flex gap-1">
                    <form action={moveFaqAction.bind(null, item.id, "up")}>
                      <button type="submit" disabled={i === 0} aria-label="نقل لأعلى" className="h-7 w-7 rounded border border-border text-xs disabled:opacity-30">↑</button>
                    </form>
                    <form action={moveFaqAction.bind(null, item.id, "down")}>
                      <button type="submit" disabled={i === items.length - 1} aria-label="نقل لأسفل" className="h-7 w-7 rounded border border-border text-xs disabled:opacity-30">↓</button>
                    </form>
                  </div>
                  <form action={toggleFaqVisibilityAction.bind(null, item.id)}>
                    <button type="submit" className={`rounded-pill px-2 py-1 text-[11px] font-semibold ${item.isVisible ? "bg-success-bg text-stock-in-text" : "bg-bg-panel text-text-faint"}`}>
                      {item.isVisible ? "ظاهر" : "مخفي"}
                    </button>
                  </form>
                  <form action={deleteFaqAction.bind(null, item.id)}>
                    <button type="submit" className="text-[11px] text-discount-ribbon">حذف</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={upsertFaqAction} className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
        <span className="text-sm font-semibold text-text-primary">سؤال جديد</span>
        <input name="questionAr" placeholder="السؤال" required className="input" />
        <textarea name="answerAr" placeholder="الجواب" rows={3} required className="input" />
        <input name="category" placeholder="التصنيف (اختياري)" className="input" />
        <button type="submit" className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white">إضافة</button>
      </form>

    </div>
  );
}
