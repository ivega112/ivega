import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { updatePaymentInstructionsAction } from "./actions";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const methods = await prisma.paymentMethod.findMany({ where: { id: { in: ["cod", "cliq"] } }, orderBy: { displayOrder: "asc" } });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">طرق الدفع</h1>
      <p className="text-xs text-text-faint">
        المتجر يدعم طريقتَي دفع فقط — الدفع عند الاستلام و CliQ. هذا ثابت ولا يمكن إضافة أو حذف طرق أخرى؛ يمكن فقط تعديل نص التعليمات الظاهر للعميل لكل طريقة.
      </p>

      <div className="flex flex-col gap-4">
        {methods.map((m) => (
          <form key={m.id} action={updatePaymentInstructionsAction.bind(null, m.id)} className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
            <span className="text-sm font-semibold text-text-primary">{m.nameAr}</span>
            <label className="flex flex-col gap-1 text-xs text-text-secondary">
              نص التعليمات الظاهر للعميل
              <textarea
                name="description"
                defaultValue={m.description ?? ""}
                rows={3}
                placeholder={m.id === "cliq" ? "مثال: اسم CliQ: Smart Line — رقم الهاتف: 07XXXXXXXX" : "مثال: ادفع نقداً عند استلام الطلب"}
                className="input"
              />
            </label>
            <button type="submit" className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white">حفظ</button>
          </form>
        ))}
      </div>
    </div>
  );
}
