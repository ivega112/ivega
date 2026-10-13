import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { ProductForm } from "../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories, brands, additionalCategories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.brand.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.productCategory.findMany({ where: { productId: id }, select: { categoryId: true } }),
  ]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">تعديل: {product.nameAr}</h1>
      <ProductForm
        categories={categories}
        brands={brands}
        initial={{
          id: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn ?? "",
          model: product.model ?? "",
          slug: product.slug,
          sku: product.sku,
          categoryId: product.categoryId,
          brandId: product.brandId,
          shortSpec: product.shortSpec ?? "",
          description: product.description ?? "",
          price: Number(product.price),
          oldPrice: product.oldPrice != null ? Number(product.oldPrice) : null,
          quantity: product.quantity,
          lowStockThreshold: product.lowStockThreshold,
          badge: product.badge,
          isVisible: product.isVisible,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          warrantyInfo: product.warrantyInfo ?? "",
          supportInfo: product.supportInfo ?? "",
          additionalCategoryIds: additionalCategories.map((c) => c.categoryId),
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          images: product.images.map((img) => ({ id: img.id, url: img.url, isPrimary: img.isPrimary })),
        }}
      />
    </div>
  );
}
