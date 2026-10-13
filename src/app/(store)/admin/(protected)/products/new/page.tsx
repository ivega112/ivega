import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.brand.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">منتج جديد</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
