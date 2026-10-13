import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { formatCurrency } from "@/lib/pricing";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import {
  upsertDeliveryMethodAction,
  deleteDeliveryMethodAction,
  upsertDeliveryZoneAction,
  deleteDeliveryZoneAction,
} from "./actions";

export default async function AdminDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ editMethodId?: string; editZoneId?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const [methods, zones] = await Promise.all([
    prisma.deliveryMethod.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.deliveryZone.findMany({ where: { isActive: true }, include: { deliveryMethod: true }, orderBy: { displayOrder: "asc" } }),
  ]);
  const deliveryMethods = methods.filter((m) => m.kind === "DELIVERY");
  const pickupMethods = methods.filter((m) => m.kind === "PICKUP");
  const editingMethod = sp.editMethodId ? methods.find((m) => m.id === sp.editMethodId) : undefined;
  const editingZone = sp.editZoneId ? zones.find((z) => z.id === sp.editZoneId) : undefined;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">التوصيل والاستلام</h1>

      <section className="rounded-card border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">طرق التوصيل</h2>
        {methods.length === 0 && <p className="mb-3 text-sm text-text-faint">لا توجد طرق توصيل بعد</p>}
        <div className="mb-4 flex flex-col gap-2">
          {methods.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-control border border-border-light p-3 text-sm">
              <span className="font-semibold">{m.nameAr}</span>
              <span className="text-text-faint">{m.kind === "PICKUP" ? "استلام من المتجر" : "توصيل"}</span>
              {m.estimatedTimeAr && <span className="text-text-muted">{m.estimatedTimeAr}</span>}
              {m.kind === "PICKUP" && m.pickupAddress && <span className="text-text-muted">{m.pickupAddress}</span>}
              <div className="ms-auto flex gap-3">
                <a href={`/admin/delivery?editMethodId=${m.id}`} className="text-xs font-semibold text-brand-action">تعديل</a>
                <form action={deleteDeliveryMethodAction.bind(null, m.id)}>
                  <ConfirmSubmitButton
                    message={`هل تريد حذف طريقة "${m.nameAr}"؟`}
                    className="text-xs font-semibold text-discount-ribbon"
                  >
                    حذف
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>

        <form action={upsertDeliveryMethodAction} className="grid grid-cols-2 gap-2">
          {editingMethod && <input type="hidden" name="id" value={editingMethod.id} />}
          <select name="kind" defaultValue={editingMethod?.kind ?? "DELIVERY"} required className="input">
            <option value="DELIVERY">توصيل</option>
            <option value="PICKUP">استلام من المتجر</option>
          </select>
          <input name="nameAr" defaultValue={editingMethod?.nameAr} placeholder="اسم الطريقة" required className="input" />
          <input name="estimatedTimeAr" defaultValue={editingMethod?.estimatedTimeAr ?? ""} placeholder="الوقت التقديري (مثال: 1-2 يوم عمل)" className="input" />
          <input name="sameDayCutoff" defaultValue={editingMethod?.sameDayCutoff ?? ""} placeholder="آخر موعد للتوصيل بنفس اليوم (مثال: 14:00)" className="input" />
          <input name="pickupAddress" defaultValue={editingMethod?.pickupAddress ?? ""} placeholder="عنوان الاستلام (لطرق الاستلام فقط)" className="input col-span-2" />
          <input name="pickupPrepMinutes" type="number" defaultValue={editingMethod?.pickupPrepMinutes ?? ""} placeholder="مدة التجهيز بالدقائق" className="input" />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white">
              {editingMethod ? "حفظ التعديلات" : "إضافة طريقة"}
            </button>
            {editingMethod && <a href="/admin/delivery" className="flex h-10 items-center px-2 text-sm text-text-muted">إلغاء</a>}
          </div>
        </form>
      </section>

      <section className="rounded-card border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">مناطق التوصيل والرسوم</h2>
        {zones.length === 0 && <p className="mb-3 text-sm text-text-faint">لا توجد مناطق بعد</p>}
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-panel text-xs text-text-muted">
              <tr>
                <th className="p-2 text-start">المنطقة</th>
                <th className="p-2 text-start">الطريقة</th>
                <th className="p-2 text-start">الرسوم</th>
                <th className="p-2 text-start">الوقت التقديري</th>
                <th className="p-2 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-t border-border-light">
                  <td className="p-2">{z.nameAr}</td>
                  <td className="p-2 text-text-muted">{z.deliveryMethod.nameAr}</td>
                  <td className="p-2 font-mono">{formatCurrency(Number(z.fee))}</td>
                  <td className="p-2 text-text-muted">{z.estimatedTimeAr ?? "—"}</td>
                  <td className="p-2">
                    <div className="flex gap-3">
                      <a href={`/admin/delivery?editZoneId=${z.id}`} className="text-xs font-semibold text-brand-action">تعديل</a>
                      <form action={deleteDeliveryZoneAction.bind(null, z.id)}>
                        <ConfirmSubmitButton
                          message={`هل تريد حذف منطقة "${z.nameAr}"؟`}
                          className="text-xs font-semibold text-discount-ribbon"
                        >
                          حذف
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={upsertDeliveryZoneAction} className="flex flex-wrap gap-2">
          {editingZone && <input type="hidden" name="id" value={editingZone.id} />}
          <input name="nameAr" defaultValue={editingZone?.nameAr} placeholder="اسم المنطقة" required className="input flex-1" />
          <input name="fee" type="number" step="0.001" min="0" defaultValue={editingZone ? Number(editingZone.fee) : undefined} placeholder="الرسوم" required className="input w-28" />
          <input name="estimatedTimeAr" defaultValue={editingZone?.estimatedTimeAr ?? ""} placeholder="الوقت التقديري" className="input w-40" />
          <select name="deliveryMethodId" defaultValue={editingZone?.deliveryMethodId} required className="input w-44">
            {deliveryMethods.map((m) => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
          </select>
          <button type="submit" className="h-10 rounded-control bg-brand-deep px-4 text-sm font-semibold text-white">
            {editingZone ? "حفظ التعديلات" : "إضافة منطقة"}
          </button>
          {editingZone && <a href="/admin/delivery" className="flex h-10 items-center px-2 text-sm text-text-muted">إلغاء</a>}
        </form>
        {deliveryMethods.length === 0 && (
          <p className="mt-2 text-xs text-badge-low-bg">أضف طريقة توصيل أولاً قبل إضافة مناطق.</p>
        )}
      </section>

      {pickupMethods.length === 0 && (
        <p className="text-xs text-text-faint">لا توجد خيارات استلام من المتجر مفعّلة حالياً.</p>
      )}
    </div>
  );
}
