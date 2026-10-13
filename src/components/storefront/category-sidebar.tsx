import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, LayoutGrid } from "lucide-react";

export interface SidebarCategory {
  id: string;
  slug: string;
  nameAr: string;
  imageUrl: string | null;
  productCount: number;
  brands: { slug: string; nameAr: string }[];
  tiles: { slug: string; nameAr: string; imageUrl: string }[];
}

/**
 * Vertical "browse categories" menu with full-height mega panels opening beside it
 * (reference layout). Panel content comes from the category's own products and brands.
 */
export function CategorySidebar({ categories }: { categories: SidebarCategory[] }) {
  return (
    <nav aria-label="تصفح الأقسام" className="relative hidden h-full lg:block">
      <ul className="h-full border border-ay-line-soft bg-white">
        {categories.map((c) => (
          <li key={c.id} className="ay-dropdown-host group/cat border-b border-ay-line-soft last:border-b-0">
            <Link
              href={`/category/${c.slug}`}
              className="flex h-[44px] items-center gap-[10px] px-[18px] text-[14px] leading-5 font-semibold text-ay-title transition-colors group-hover/cat:bg-ay-page group-hover/cat:text-ay-primary"
            >
              {c.imageUrl ? (
                <span className="relative size-[20px] flex-none overflow-hidden rounded-[3px]">
                  <Image src={c.imageUrl} alt="" fill sizes="20px" className="object-cover" />
                </span>
              ) : (
                <LayoutGrid className="size-[18px] flex-none" strokeWidth={1.6} />
              )}
              <span className="flex-1 truncate">{c.nameAr}</span>
              <ChevronLeft className="size-[14px] flex-none opacity-40 ltr:rotate-180" />
            </Link>
            {c.tiles.length > 0 && (
              <div className="ay-dropdown start-full top-0 h-full w-[950px] max-w-[calc(100vw-340px)] overflow-y-auto p-[30px]">
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-ay-line pb-3">
                  <p className="text-[16px] font-semibold text-ay-heading">{c.nameAr}</p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] font-medium">
                    {c.brands.map((b) => (
                      <Link key={b.slug} href={`/category/${c.slug}?brand=${b.slug}`} className="text-[#535353] hover:text-ay-primary">
                        ‹ {b.nameAr}
                      </Link>
                    ))}
                    <Link href={`/category/${c.slug}`} className="font-semibold text-ay-primary">
                      عرض الكل ({c.productCount})
                    </Link>
                  </div>
                </div>
                <ul className="grid grid-cols-5 gap-x-5 gap-y-6">
                  {c.tiles.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/product/${t.slug}`} className="group/tile flex flex-col items-center gap-3 text-center">
                        <span className="relative block aspect-square w-full max-w-[130px]">
                          <Image src={t.imageUrl} alt="" fill sizes="130px" className="object-contain transition-transform duration-300 group-hover/tile:scale-105" />
                        </span>
                        <span className="line-clamp-2 text-[15px] leading-[1.4] font-semibold text-[#54595f] group-hover/tile:text-ay-primary">{t.nameAr}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
