import Image from "next/image";
import Link from "next/link";

export interface BrandCircleData {
  slug: string;
  nameAr: string;
  logoUrl?: string | null;
}

/** Reference-style brand strip: bordered cells, greyscale logos that colour on hover — navigates to /shop?brand=slug. */
export function BrandScroller({ brands }: { brands: BrandCircleData[] }) {
  return (
    <ul className="ay-no-scrollbar flex overflow-x-auto border-y border-ay-line bg-white">
      {brands.map((b) => (
        <li key={b.slug} className="w-1/3 flex-none border-e border-ay-line first:border-s sm:w-1/5 lg:w-[12.5%]">
          <Link href={`/shop?brand=${b.slug}`} aria-label={`تصفح منتجات ${b.nameAr}`} className="group grid h-[100px] place-items-center px-3">
            {b.logoUrl ? (
              <span className="relative block h-[60px] w-full">
                <Image
                  src={b.logoUrl}
                  alt={b.nameAr}
                  fill
                  sizes="140px"
                  className="object-contain opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                />
              </span>
            ) : (
              <span className="text-[15px] font-bold text-[#999] transition-colors group-hover:text-ay-primary">{b.nameAr}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
