import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import {
  approveReviewAction,
  rejectReviewAction,
  toggleReviewVisibilityAction,
  toggleReviewFeaturedAction,
  archiveReviewAction,
  createReviewAction,
  updateReviewAction,
  deleteReviewAction,
} from "./actions";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; rating?: string; productId?: string; editId?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const where: Record<string, unknown> = { isArchived: false };
  if (sp.status === "pending") Object.assign(where, { isApproved: false });
  if (sp.status === "approved") Object.assign(where, { isApproved: true });
  if (sp.status === "hidden") Object.assign(where, { isVisible: false });
  if (sp.status === "featured") Object.assign(where, { isFeatured: true });
  if (sp.rating) Object.assign(where, { rating: Number(sp.rating) });
  if (sp.productId) Object.assign(where, { productId: sp.productId });

  const [reviews, products] = await Promise.all([
    prisma.review.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
  ]);
  const productNameById = new Map(products.map((p) => [p.id, p.nameAr]));
  const editing = sp.editId ? reviews.find((r) => r.id === sp.editId) : undefined;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">تقييمات العملاء</h1>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex gap-2 text-xs">
          <a href="/admin/reviews" className={`rounded-pill border px-3 py-1.5 ${!sp.status ? "border-brand-action text-brand-action" : "border-border"}`}>الكل</a>
          <a href="/admin/reviews?status=pending" className={`rounded-pill border px-3 py-1.5 ${sp.status === "pending" ? "border-brand-action text-brand-action" : "border-border"}`}>بانتظار المراجعة</a>
          <a href="/admin/reviews?status=approved" className={`rounded-pill border px-3 py-1.5 ${sp.status === "approved" ? "border-brand-action text-brand-action" : "border-border"}`}>معتمدة</a>
          <a href="/admin/reviews?status=hidden" className={`rounded-pill border px-3 py-1.5 ${sp.status === "hidden" ? "border-brand-action text-brand-action" : "border-border"}`}>مخفية</a>
          <a href="/admin/reviews?status=featured" className={`rounded-pill border px-3 py-1.5 ${sp.status === "featured" ? "border-brand-action text-brand-action" : "border-border"}`}>مميّزة</a>
        </div>
        <form className="flex gap-2">
          <select name="rating" defaultValue={sp.rating ?? ""} className="input h-9 w-28 text-xs">
            <option value="">كل التقييمات</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} نجوم</option>)}
          </select>
          <select name="productId" defaultValue={sp.productId ?? ""} className="input h-9 w-48 text-xs">
            <option value="">كل المنتجات</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
          </select>
          <button type="submit" className="h-9 rounded-control bg-brand-deep px-3 text-xs font-semibold text-white">تصفية</button>
        </form>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-card border border-border bg-bg-panel p-6 text-center text-sm text-text-muted">لا توجد تقييمات مطابقة</div>
      ) : (
        <div className="flex flex-col gap-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-card border border-border bg-white p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">{r.authorName}</span>
                <span className="font-mono text-xs text-brand-deep">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              {r.productId && productNameById.has(r.productId) && (
                <span className="mb-1 block text-xs text-text-muted">المنتج: {productNameById.get(r.productId)}</span>
              )}
              <p className="mb-2 text-sm text-text-body">{r.bodyAr}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-pill px-2 py-1 font-semibold ${r.isApproved ? "bg-success-bg text-stock-in-text" : "bg-bg-panel text-text-faint"}`}>
                  {r.isApproved ? "معتمد" : "بانتظار المراجعة"}
                </span>
                <span className={`rounded-pill px-2 py-1 font-semibold ${r.isVisible ? "bg-success-bg text-stock-in-text" : "bg-bg-panel text-text-faint"}`}>
                  {r.isVisible ? "ظاهر" : "مخفي"}
                </span>
                {!r.isApproved && (
                  <form action={approveReviewAction.bind(null, r.id)}>
                    <button type="submit" className="rounded-pill bg-whatsapp px-2 py-1 font-semibold text-white">اعتماد</button>
                  </form>
                )}
                {r.isApproved && (
                  <form action={rejectReviewAction.bind(null, r.id)}>
                    <button type="submit" className="rounded-pill border border-discount-ribbon px-2 py-1 font-semibold text-discount-ribbon">رفض</button>
                  </form>
                )}
                <form action={toggleReviewVisibilityAction.bind(null, r.id)}>
                  <button type="submit" className="rounded-pill border border-border px-2 py-1">{r.isVisible ? "إخفاء" : "إظهار"}</button>
                </form>
                <form action={toggleReviewFeaturedAction.bind(null, r.id)}>
                  <button type="submit" className={`rounded-pill border px-2 py-1 ${r.isFeatured ? "border-badge-pick-bg text-badge-pick-bg" : "border-border"}`}>
                    {r.isFeatured ? "مميّز ✓" : "تمييز"}
                  </button>
                </form>
                <a href={`/admin/reviews?editId=${r.id}`} className="rounded-pill border border-border px-2 py-1 font-semibold text-brand-action">تعديل</a>
                <form action={archiveReviewAction.bind(null, r.id)}>
                  <button type="submit" className="rounded-pill px-2 py-1 text-text-faint">أرشفة</button>
                </form>
                <form action={deleteReviewAction.bind(null, r.id)}>
                  <ConfirmSubmitButton
                    message={`هل تريد حذف تقييم "${r.authorName}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`}
                    className="rounded-pill border border-discount-ribbon px-2 py-1 font-semibold text-discount-ribbon"
                  >
                    حذف نهائي
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        action={editing ? updateReviewAction.bind(null, editing.id) : createReviewAction}
        className="flex flex-col gap-2 rounded-card border border-border bg-white p-5"
      >
        <span className="text-sm font-semibold text-text-primary">{editing ? `تعديل تقييم "${editing.authorName}"` : "إضافة تقييم يدوياً"}</span>
        <input name="authorName" defaultValue={editing?.authorName} placeholder="اسم العميل" required className="input" />
        <select name="rating" defaultValue={editing?.rating ?? 5} className="input">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} نجوم</option>)}
        </select>
        <select name="productId" defaultValue={editing?.productId ?? ""} className="input">
          <option value="">بدون ربط بمنتج</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
        </select>
        <textarea name="bodyAr" defaultValue={editing?.bodyAr} placeholder="نص التقييم" rows={2} required className="input" />
        <div className="flex gap-2">
          <button type="submit" className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white">
            {editing ? "حفظ التعديلات" : "إضافة"}
          </button>
          {editing && <a href="/admin/reviews" className="flex h-10 items-center px-2 text-sm text-text-muted">إلغاء</a>}
        </div>
      </form>
    </div>
  );
}
