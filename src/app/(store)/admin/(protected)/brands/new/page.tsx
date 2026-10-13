import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { BrandForm } from "../brand-form";

export default async function NewBrandPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    select: { id: true, nameAr: true, sku: true, isVisible: true, brandId: true, category: { select: { nameAr: true } } },
    orderBy: { nameAr: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">شركة جديدة</h1>
        <Link href="/admin/brands" className="text-sm text-brand-action">رجوع للشركات</Link>
      </div>
      <BrandForm products={products} />
    </div>
  );
}
