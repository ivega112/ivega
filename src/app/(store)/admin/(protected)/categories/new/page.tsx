import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    select: { id: true, nameAr: true, sku: true, isVisible: true, categoryId: true, brand: { select: { nameAr: true } } },
    orderBy: { nameAr: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">قسم جديد</h1>
        <Link href="/admin/categories" className="text-sm text-brand-action">رجوع للأقسام</Link>
      </div>
      <CategoryForm products={products} secondaryIds={new Set()} />
    </div>
  );
}
