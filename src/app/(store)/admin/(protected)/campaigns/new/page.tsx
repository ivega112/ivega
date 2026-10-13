import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { CampaignForm } from "../campaign-form";

export default async function NewCampaignPage() {
  await requireAdmin();
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({ where: { isArchived: false }, select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
    prisma.category.findMany({ where: { isArchived: false }, select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
    prisma.brand.findMany({ where: { isArchived: false }, select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">حملة جديدة</h1>
      <CampaignForm products={products} categories={categories} brands={brands} />
    </div>
  );
}
