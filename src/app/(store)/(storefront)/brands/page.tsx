import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageTitle } from "@/components/storefront/page-title";

export const metadata: Metadata = { title: "الشركات" };

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { isVisible: true, isArchived: false },
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { products: { where: { isVisible: true, isArchived: false } } } } },
  });

  return (
    <div>
      <PageTitle title="الشركات" />
      <div className="ay-container grid grid-cols-2 gap-[15px] py-[40px] sm:grid-cols-3 lg:grid-cols-5">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/brands/${b.slug}`}
            className="group flex flex-col items-center gap-3 bg-white p-6 text-center transition-shadow hover:shadow-[0_0_8px_rgba(0,0,0,0.1)]"
          >
            <span className="relative grid h-[90px] w-full place-items-center">
              {b.logoUrl ? (
                <Image src={b.logoUrl} alt={b.nameAr} fill sizes="200px" className="object-contain grayscale transition-all group-hover:grayscale-0" />
              ) : (
                <span className="text-[22px] font-bold text-[#999] group-hover:text-ay-primary">{b.nameAr}</span>
              )}
            </span>
            <span className="text-[15px] font-semibold text-ay-title group-hover:text-ay-primary">{b.nameAr}</span>
            <span className="text-[13px]">{b._count.products} منتج</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
