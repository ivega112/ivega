import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pricing";

export default async function AdminDashboardPage() {
  const [orderCount, pendingCount, revenueAgg, stockCandidates, outOfStock, latestOrders, bestSellers] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING_WHATSAPP" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "COMPLETED"] } } }),
    prisma.product.findMany({ where: { quantity: { gt: 0 }, isArchived: false }, orderBy: { quantity: "asc" }, take: 20 }),
    prisma.product.count({ where: { quantity: 0, isArchived: false } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.product.findMany({ orderBy: { soldCount: "desc" }, take: 5 }),
  ]);

  const lowStock = stockCandidates.filter((p) => p.quantity <= p.lowStockThreshold).slice(0, 5);

  const kpis = [
    { label: "إجمالي الطلبات", value: orderCount },
    { label: "طلبات بانتظار واتساب", value: pendingCount },
    { label: "إجمالي المبيعات المؤكدة", value: formatCurrency(Number(revenueAgg._sum.total ?? 0)) },
    { label: "منتجات نفدت من المخزون", value: outOfStock },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">لوحة التحكم</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-card border border-border bg-white p-4">
            <span className="block text-xs text-text-faint">{k.label}</span>
            <span className="mt-1 block text-xl font-bold text-text-primary">{k.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">أحدث الطلبات</h2>
          <div className="flex flex-col gap-2">
            {latestOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <span className="font-mono">{o.orderNumber}</span>
                <span className="text-text-muted">{o.status}</span>
                <span className="font-mono font-semibold">{formatCurrency(Number(o.total))}</span>
              </div>
            ))}
            {latestOrders.length === 0 && <span className="text-xs text-text-faint">لا توجد طلبات بعد</span>}
          </div>
        </div>

        <div className="rounded-card border border-border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">الأكثر مبيعاً</h2>
          <div className="flex flex-col gap-2">
            {bestSellers.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.nameAr}</span>
                <span className="text-text-muted">{p.soldCount} مباع</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-card border border-border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">تنبيهات المخزون المنخفض</h2>
          {lowStock.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span>{p.nameAr}</span>
              <span className="font-mono text-badge-low-bg">{p.quantity} متبقي</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
