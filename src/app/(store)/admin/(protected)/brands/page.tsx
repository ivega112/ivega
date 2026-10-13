import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { deleteBrandAction, toggleBrandVisibilityAction } from "./actions";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";

export default async function AdminBrandsPage() {
  await requireAdmin();
  const brands = await prisma.brand.findMany({
    where: { isArchived: false },
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">الشركات</h1>
        <Link href="/admin/brands/new" className="h-10 rounded-control bg-brand-action px-4 text-sm font-semibold leading-10 text-white">
          + شركة جديدة
        </Link>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel text-xs text-text-muted">
            <tr><th className="p-3 text-start">الاسم</th><th className="p-3 text-start">Slug</th><th className="p-3 text-start">عدد المنتجات</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-t border-border-light">
                <td className="p-3">
                  <Link href={`/admin/brands/${b.id}`} className="font-medium text-text-primary hover:text-brand-action">{b.nameAr}</Link>
                </td>
                <td className="p-3 font-mono text-xs">{b.slug}</td>
                <td className="p-3">{b._count.products}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <form action={toggleBrandVisibilityAction.bind(null, b.id, b.isVisible)}>
                      <button type="submit" className={b.isVisible ? "text-brand-action hover:text-brand-deep" : "text-text-muted hover:text-text-primary"}>
                        {b.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </form>
                    <Link href={`/admin/brands/${b.id}`} className="text-brand-action hover:text-brand-deep">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <form action={deleteBrandAction.bind(null, b.id)}>
                      <button type="submit" className="text-discount-ribbon hover:opacity-80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
