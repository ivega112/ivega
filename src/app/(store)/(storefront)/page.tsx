import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/catalog";
import { mapProductToCard } from "@/lib/map-product-card";
import { ProductCard } from "@/components/storefront/product-card";
import { CampaignCountdown } from "@/components/storefront/campaign-countdown";
import { HeroSlider } from "@/components/storefront/hero-slider";
import { Carousel } from "@/components/storefront/carousel";
import { getEffectivePricesForProducts } from "@/lib/campaign-pricing";

export const revalidate = 3600;

type CatalogItem = Awaited<ReturnType<typeof getProducts>>["items"][number];

export default async function HomePage() {
  const [sections, categories, heroSlides, campaigns, reviews, menuProducts] = await Promise.all([
    prisma.homepageSection.findMany({ where: { isEnabled: true }, orderBy: { displayOrder: "asc" } }),
    prisma.category.findMany({ where: { isVisible: true, isArchived: false }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.heroSlide.findMany({ where: { isArchived: false }, orderBy: { displayOrder: "asc" }, take: 10 }),
    prisma.campaign.findMany({
      where: {
        isEnabled: true,
        isArchived: false,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
        placements: { has: "HOMEPAGE_SECTION" },
      },
      orderBy: { priority: "desc" },
    }),
    prisma.review.findMany({ where: { isApproved: true, isVisible: true, isArchived: false }, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 24 }),
    // One bounded query feeds every mega-menu panel (image + name only, so no pricing needed).
    prisma.product.findMany({
      where: { isVisible: true, isArchived: false },
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
      take: 300,
      select: {
        slug: true,
        nameAr: true,
        categoryId: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
  ]);

  const sectionByKey = new Map(sections.map((s) => [s.key, s]));
  const featuredConfig = (sectionByKey.get("featured_products")?.config as { limit?: number } | null) ?? {};
  const featuredLimit = Math.min(25, Math.max(1, featuredConfig.limit ?? 20));
  const limitOf = (key: string, fallback: number) => (sectionByKey.get(key)?.config as { limit?: number } | null)?.limit ?? fallback;

  const [newArrivals, offers] = await Promise.all([
    getProducts({ isNew: true, sort: "recommended", pageSize: featuredLimit }),
    getProducts({ discounted: true, sort: "recommended", pageSize: featuredLimit }),
  ]);

  // Campaign pricing for every product rendered on the page, resolved in one pass.
  const allItems = new Map<string, CatalogItem>();
  for (const list of [newArrivals, offers]) for (const p of list.items) allItems.set(p.id, p);
  const effectivePrices = await getEffectivePricesForProducts(
    [...allItems.values()].map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      brandId: p.brandId,
      price: Number(p.price),
      additionalCategoryIds: p.additionalCategories.map((c) => c.categoryId),
    }))
  );
  const toCards = (items: CatalogItem[]) => items.map((p) => mapProductToCard(p, effectivePrices.get(p.id)));

  // Every visible category is shown — no cap — so newly added ones appear automatically.
  const categoryCards = categories.map((c) => {
    const own = menuProducts.filter((p) => p.categoryId === c.id);
    return {
      id: c.id,
      slug: c.slug,
      nameAr: c.nameAr,
      imageUrl: c.imageUrl ?? own[0]?.images[0]?.url ?? null,
    };
  });

  const blocks: React.ReactNode[] = [];
  for (const section of sections) {
    switch (section.key) {
      case "categories":
        break;
      case "featured_products":
        if (newArrivals.items.length > 0 || offers.items.length > 0) {
          blocks.push(
            <section
              key="tabs"
            >
              {newArrivals.items.length > 0 && (
                <Carousel title={<div className="flex items-baseline gap-4"><h2 className="ay-section-title">جديدنا</h2><Link href="/shop?new=1" className="text-[13px] font-semibold text-ay-primary hover:underline">عرض المزيد</Link></div>}>
                  {toCards(newArrivals.items).map((p) => <ProductCard key={p.id} product={p} />)}
                </Carousel>
              )}
              {offers.items.length > 0 && (
                <div className={newArrivals.items.length > 0 ? "mt-10" : ""}>
                  <Carousel title={<div className="flex items-baseline gap-4"><h2 className="ay-section-title">الخصومات والعروض</h2><Link href="/shop?discounted=1" className="text-[13px] font-semibold text-ay-primary hover:underline">عرض المزيد</Link></div>}>
                    {toCards(offers.items).map((p) => <ProductCard key={p.id} product={p} />)}
                  </Carousel>
                </div>
              )}
            </section>
          );
        }
        break;
      case "campaigns":
        if (campaigns.length > 0) {
          blocks.push(
            <section key="campaigns">
              <div className="mb-[20px]">
                <h2 className="ay-section-title">{section.titleAr}</h2>
                {section.subtitleAr && <p className="mt-1 text-[14px]">{section.subtitleAr}</p>}
              </div>
              <div className="grid grid-cols-1 gap-[15px] md:grid-cols-2">
                {campaigns.map((c) => (
                  <div key={c.id} className="relative overflow-hidden rounded-[8px] bg-[#1e1e1e] p-6 text-white">
                    {c.bannerImageUrl && <Image src={c.bannerImageUrl} alt="" fill className="object-cover opacity-40" />}
                    <div className="relative z-10 flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[18px] font-bold">{c.nameAr}</span>
                        {c.badgeText && <span className="bg-black px-2.5 py-[5px] text-[12px] font-semibold">{c.badgeText}</span>}
                      </div>
                      {c.promoTextAr && <p className="text-[14px] text-white/85">{c.promoTextAr}</p>}
                      {c.showCountdown && <CampaignCountdown endsAt={c.endsAt.toISOString()} className="text-[14px]" />}
                      {c.ctaLabel && c.ctaUrl && (
                        <Link href={c.ctaUrl} className="mt-2 inline-flex h-[38px] items-center rounded-[35px] bg-[#3a8bd8] px-[26px] text-[13px] font-semibold text-white hover:bg-ay-primary">
                          {c.ctaLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        break;
      case "reviews":
        if (reviews.length > 0) {
          blocks.push(
            <section key="reviews">
              <div className="mb-[20px]">
                <h2 className="ay-section-title">{section.titleAr}</h2>
                {section.subtitleAr && <p className="mt-1 text-[14px]">{section.subtitleAr}</p>}
              </div>
              <div className="grid grid-cols-1 gap-[15px] md:grid-cols-3">
                {reviews.slice(0, limitOf("reviews", 6)).map((r) => (
                  <div key={r.id} className="bg-white p-6">
                    <span className="text-[15px] tracking-widest text-[#f4b400]">
                      {"★".repeat(r.rating)}
                      <span className="text-[#ddd]">{"★".repeat(5 - r.rating)}</span>
                    </span>
                    <p className="mt-3 text-[14px] leading-[1.8]">{r.bodyAr}</p>
                    <span className="mt-3 block text-[14px] font-semibold text-ay-title">{r.authorName}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        break;
    }
  }

  return (
    <div className="space-y-[40px] pb-[60px]">
      <section className="w-full">
        <div className="min-w-0">
          {heroSlides.length > 0 ? (
            <HeroSlider slides={heroSlides.map((s) => ({ id: s.id, imageUrl: s.imageUrl, mediaType: s.mediaType, videoUrl: s.videoUrl }))} />
          ) : (
            <h1 className="sr-only">Smart Line</h1>
          )}
        </div>
      </section>

      <div className="ay-container space-y-[40px]">
        {categoryCards.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between"><h2 className="ay-section-title">تسوّق حسب القسم</h2><Link href="/shop" className="text-[13px] font-semibold text-ay-primary hover:underline">كل المنتجات</Link></div>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
              {categoryCards.map((c) => <Link key={c.id} href={`/category/${c.slug}`} className="group min-w-0 text-center transition hover:-translate-y-0.5"><div className="relative aspect-square overflow-hidden rounded-[8px] bg-bg-subtle shadow-sm transition-shadow group-hover:shadow-card">{c.imageUrl ? <Image src={c.imageUrl} alt={c.nameAr} fill sizes="(max-width: 640px) 33vw, 145px" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <span className="grid size-full place-items-center px-2 text-center text-xs text-text-faint">{c.nameAr}</span>}</div><span className="mt-2 block truncate px-1 text-xs font-semibold text-ay-title sm:text-[13px]">{c.nameAr}</span></Link>)}
            </div>
          </section>
        )}
        {blocks}
      </div>

    </div>
  );
}
