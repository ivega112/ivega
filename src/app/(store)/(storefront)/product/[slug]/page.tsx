import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductDetail } from "@/components/storefront/product-detail";
import { ProductCard } from "@/components/storefront/product-card";
import { Carousel } from "@/components/storefront/carousel";
import { getStoreSettings } from "@/lib/settings";
import { mapProductToCard } from "@/lib/map-product-card";
import { safeJsonLd } from "@/lib/json-ld";
import { getEffectivePricesForProducts } from "@/lib/campaign-pricing";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle || product.nameAr,
    description: product.seoDescription || product.shortSpec || undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isVisible) notFound();

  const [related, settings] = await Promise.all([getRelatedProducts(product.categoryId, product.id, 10), getStoreSettings()]);

  const allForPricing = [product, ...related];
  const effectivePrices = await getEffectivePricesForProducts(
    allForPricing.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      brandId: p.brandId,
      price: Number(p.price),
      additionalCategoryIds: p.additionalCategories.map((c) => c.categoryId),
    }))
  );
  const mainEffectivePrice = effectivePrices.get(product.id);
  const displayPrice = mainEffectivePrice?.finalPrice ?? Number(product.price);
  const displayOldPrice = mainEffectivePrice?.basePrice ?? (product.oldPrice != null ? Number(product.oldPrice) : null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameAr,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand.nameAr },
    offers: {
      "@type": "Offer",
      priceCurrency: "JOD",
      price: displayPrice,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ProductDetail
        product={{
          id: product.id,
          nameAr: product.nameAr,
          sku: product.sku,
          model: product.model,
          brandName: product.brand.nameAr,
          categoryName: product.category.nameAr,
          categorySlug: product.category.slug,
          brandSlug: product.brand.slug,
          brandLogoUrl: product.brand.logoUrl,
          specifications: product.specifications.map((s) => ({ label: s.labelAr, value: s.value })),
          price: displayPrice,
          oldPrice: displayOldPrice,
          quantity: product.quantity,
          shortSpec: product.shortSpec,
          description: product.description,
          warrantyInfo: product.warrantyInfo,
          images: product.images.map((i) => ({ url: i.url, altText: i.altText })),
        }}
        whatsappNumber={settings.whatsappButtonLocations.includes("product") ? settings.whatsappNumber : null}
      />

      {related.length > 0 && (
        <div className="ay-container py-[50px]">
          <Carousel title={<h2 className="ay-section-title">منتجات ذات صلة</h2>}>
            {related.map((p) => (
              <ProductCard key={p.id} product={mapProductToCard(p, effectivePrices.get(p.id))} />
            ))}
          </Carousel>
        </div>
      )}
    </div>
  );
}
