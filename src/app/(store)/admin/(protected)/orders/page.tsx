import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pricing";
import { requireAdmin } from "@/lib/auth/guard";
import { ORDER_STATUS_LABEL_AR as STATUS_LABEL } from "@/lib/order-status-labels";
import { OrderRowAction } from "./order-row-action";

import { Prisma, OrderStatus } from "@prisma/client";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const currentStatus = sp.status || "ALL";

  let statusFilter: Prisma.EnumOrderStatusFilter | OrderStatus | undefined = undefined;
  if (currentStatus === "NEW") {
    statusFilter = { in: ["PENDING_WHATSAPP", "CONTACTED", "CONFIRMED"] };
  } else if (currentStatus !== "ALL") {
    statusFilter = currentStatus as OrderStatus;
  }

  const orders = await prisma.order.findMany({
    where: {
      status: statusFilter,
      OR: sp.q
        ? [{ orderNumber: { contains: sp.q, mode: "insensitive" } }, { customerPhone: { contains: sp.q } }]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const tabs = [
    { key: "ALL", label: "الكل" },
    { key: "NEW", label: "جديد" },
    { key: "PREPARING", label: "قيد التجهيز" },
    { key: "OUT_FOR_DELIVERY", label: "قيد التوصيل" },
    { key: "COMPLETED", label: "مؤكد وتم التوصيل" },
    { key: "CANCELLED", label: "ملغي" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">الطلبات</h1>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={sp.q} placeholder="بحث برقم الطلب أو الهاتف" className="h-10 flex-1 max-w-sm rounded-control border border-border px-3 text-sm" />
        <input type="hidden" name="status" value={currentStatus} />
        <button type="submit" className="h-10 rounded-control bg-brand-action px-4 text-sm font-semibold text-white">بحث</button>
      </form>

      <div className="flex gap-2 border-b border-border-light pb-2 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/orders?status=${tab.key}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
              className={`rounded-control px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive ? "bg-brand-deep text-white" : "bg-bg-panel text-text-muted hover:bg-border-light"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel text-xs text-text-muted">
            <tr>
              <th className="p-3 text-start">رقم الطلب</th>
              <th className="p-3 text-start">العميل</th>
              <th className="p-3 text-start">الحالة</th>
              <th className="p-3 text-start">الإجمالي</th>
              <th className="p-3 text-start">التاريخ</th>
              <th className="p-3 text-start">إجراء سريع</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="group border-t border-border-light hover:bg-bg-panel/50 transition-colors">
                <td className="p-0">
                  <Link href={`/admin/orders/${o.id}`} className="block p-3 font-mono font-semibold text-brand-action group-hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/admin/orders/${o.id}`} className="block p-3">
                    {o.customerName}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/admin/orders/${o.id}`} className="block p-3">
                    <span className="rounded-pill bg-bg-panel px-2 py-1 text-xs border border-border-light">
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </Link>
                </td>
                <td className="p-0 font-mono">
                  <Link href={`/admin/orders/${o.id}`} className="block p-3">
                    {formatCurrency(Number(o.total))}
                  </Link>
                </td>
                <td className="p-0 text-text-muted">
                  <Link href={`/admin/orders/${o.id}`} className="block p-3">
                    {o.createdAt.toLocaleDateString("ar-JO")}
                  </Link>
                </td>
                <td className="p-3">
                  <OrderRowAction orderId={o.id} status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-text-faint">لا توجد طلبات في هذه الحالة</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
