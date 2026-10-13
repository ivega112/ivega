import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pricing";
import { requireAdmin } from "@/lib/auth/guard";
import { ORDER_STATUS_LABEL_AR } from "@/lib/order-status-labels";
import { OrderActionsPanel } from "./order-actions-panel";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } }, deliveryZone: true, paymentMethod: true },
  });
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary">طلب {order.orderNumber}</h1>
          <span className="rounded-pill border border-border bg-bg-panel px-3 py-1 text-xs font-semibold text-text-secondary">
            {ORDER_STATUS_LABEL_AR[order.status] ?? order.status}
          </span>
        </div>
        <OrderActionsPanel orderId={order.id} status={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">المنتجات</h2>
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between border-t border-border-light py-2 text-sm first:border-t-0">
                <span>{it.nameSnapshot} <span className="font-mono text-xs text-text-faint">({it.skuSnapshot})</span></span>
                <span>× {it.quantity}</span>
                <span className="font-mono">{formatCurrency(Number(it.lineTotal))}</span>
              </div>
            ))}
          </div>

          <div className="rounded-card border border-border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">سجل الحالة</h2>
            {order.statusHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between border-t border-border-light py-1.5 text-xs first:border-t-0">
                <span>{h.fromStatus ? ORDER_STATUS_LABEL_AR[h.fromStatus] ?? h.fromStatus : "—"} → {ORDER_STATUS_LABEL_AR[h.toStatus] ?? h.toStatus}</span>
                <span className="text-text-faint">{h.createdAt.toLocaleString("ar-JO")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-border bg-white p-4 text-sm">
            <h2 className="mb-2 font-semibold text-text-primary">بيانات العميل</h2>
            <p>{order.customerName}</p>
            <p dir="ltr" className="text-end">{order.customerPhone}</p>
            {order.addressDetails && <p className="mt-1 text-text-muted">{order.addressDetails}</p>}
            <p className="mt-1 text-text-muted">{order.deliveryZone?.nameAr ?? "استلام من المتجر"}</p>
            <p className="text-text-muted">{order.paymentMethod?.nameAr ?? "غير محدد"}</p>
          </div>
          <div className="rounded-card border border-border bg-white p-4 text-sm">
            <div className="flex justify-between"><span>الفرعي</span><span className="font-mono">{formatCurrency(Number(order.subtotal))}</span></div>
            <div className="flex justify-between"><span>التوصيل</span><span className="font-mono">{formatCurrency(Number(order.deliveryFee))}</span></div>
            <div className="mt-1 flex justify-between border-t border-border-light pt-1 font-bold"><span>الإجمالي</span><span className="font-mono">{formatCurrency(Number(order.total))}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
