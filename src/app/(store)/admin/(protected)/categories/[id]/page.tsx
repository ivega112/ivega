import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { CategoryForm } from "../category-form";

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  const [products, secondaryLinks] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, nameAr: true, sku: true, isVisible: true, categoryId: true, brand: { select: { nameAr: true } } },
      orderBy: { nameAr: "asc" },
    }),
    prisma.productCategory.findMany({ where: { categoryId: id }, select: { productId: true } }),
  ]);
  const secondaryIds = new Set(secondaryLinks.map((l) => l.productId));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">تعديل قسم: {category.nameAr}</h1>
        <Link href="/admin/categories" className="text-sm text-brand-action">رجوع للأقسام</Link>
      </div>

      {sp.created === "1" && (
        <p role="status" className="max-w-3xl rounded-control border border-success-border bg-success-bg p-2 text-sm text-stock-in-text">
          تم إنشاء القسم بنجاح
        </p>
      )}
      {sp.saved === "1" && (
        <p role="status" className="max-w-3xl rounded-control border border-success-border bg-success-bg p-2 text-sm text-stock-in-text">
          تم الحفظ
        </p>
      )}

      <CategoryForm category={category} products={products} secondaryIds={secondaryIds} />
    </div>
  );
}
