import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { deleteCategoryAction, moveCategoryAction, toggleCategoryVisibilityAction, type CategoryMove } from "./actions";
import { Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from "lucide-react";

const MOVES: { move: CategoryMove; label: string; Icon: typeof ArrowUp }[] = [
  { move: "top", label: "نقل لأول القائمة", Icon: ChevronsUp },
  { move: "up", label: "نقل لأعلى", Icon: ArrowUp },
  { move: "down", label: "نقل لأسفل", Icon: ArrowDown },
  { move: "bottom", label: "نقل لآخر القائمة", Icon: ChevronsDown },
];

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { products: true, additionalProducts: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">الأقسام</h1>
          <p className="mt-1 text-xs text-text-muted">الترتيب هنا هو نفس ترتيب ظهور الأقسام في الموقع.</p>
        </div>
        <Link href="/admin/categories/new" className="h-10 rounded-control bg-brand-action px-4 text-sm font-semibold leading-10 text-white">
          + قسم جديد
        </Link>
      </div>

      <div className="overflow-x-auto rounded-card border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-bg-panel text-xs text-text-muted">
            <tr><th className="p-3 text-start">الترتيب</th><th className="p-3 text-start">الاسم</th><th className="p-3 text-start">Slug</th><th className="p-3 text-start">عدد المنتجات</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
              <tr key={c.id} className="border-t border-border-light">
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="w-6 text-center text-xs font-semibold text-text-muted">{i + 1}</span>
                    {MOVES.map(({ move, label, Icon }) => {
                      const disabled = move === "up" || move === "top" ? i === 0 : i === categories.length - 1;
                      return (
                        <form key={move} action={moveCategoryAction.bind(null, c.id, move)}>
                          <button
                            type="submit"
                            disabled={disabled}
                            aria-label={`${label}: ${c.nameAr}`}
                            title={label}
                            className="grid h-7 w-7 place-items-center rounded border border-border text-text-secondary hover:border-brand-action hover:text-brand-action disabled:pointer-events-none disabled:opacity-30"
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </td>
                <td className="p-3">
                  <Link href={`/admin/categories/${c.id}`} className="font-medium text-text-primary hover:text-brand-action">{c.nameAr}</Link>
                </td>
                <td className="p-3 font-mono text-xs">{c.slug}</td>
                <td className="p-3">{c._count.products + c._count.additionalProducts}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <form action={toggleCategoryVisibilityAction.bind(null, c.id, c.isVisible)}>
                      <button type="submit" className={c.isVisible ? "text-brand-action hover:text-brand-deep" : "text-text-muted hover:text-text-primary"}>
                        {c.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </form>
                    <Link href={`/admin/categories/${c.id}`} className="text-brand-action hover:text-brand-deep">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <form action={deleteCategoryAction.bind(null, c.id)}>
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
