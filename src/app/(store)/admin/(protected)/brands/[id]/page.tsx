import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { BrandForm } from "../brand-form";

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) notFound();

  const products = await prisma.product.findMany({
    select: { id: true, nameAr: true, sku: true, isVisible: true, brandId: true, category: { select: { nameAr: true } } },
    orderBy: { nameAr: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">تعديل شركة: {brand.nameAr}</h1>
        <Link href="/admin/brands" className="text-sm text-brand-action">رجوع للشركات</Link>
      </div>

      {sp.created === "1" && (
        <p role="status" className="max-w-3xl rounded-control border border-success-border bg-success-bg p-2 text-sm text-stock-in-text">
          تم إنشاء الشركة بنجاح
        </p>
      )}
      {sp.saved === "1" && (
        <p role="status" className="max-w-3xl rounded-control border border-success-border bg-success-bg p-2 text-sm text-stock-in-text">
          تم الحفظ
        </p>
      )}

      <BrandForm brand={brand} products={products} />
    </div>
  );
}
