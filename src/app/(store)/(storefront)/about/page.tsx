import type { Metadata } from "next";
import Link from "next/link";
import { getStoreSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "من نحن" };

const VALUE_PROPS = [
  { title: "ضمان الوكيل", body: "جميع أجهزة Smart Line مغطاة بضمان الوكيل الرسمي." },
  { title: "توصيل لكل المملكة", body: "نوصل طلبك أينما كنت داخل الأردن." },
  { title: "الدفع عند الاستلام", body: "ادفع بثقة بعد استلام طلبك، مع خيارات دفع أخرى متاحة." },
  { title: "دعم مباشر عبر واتساب", body: "فريقنا جاهز للرد على استفساراتك قبل الشراء وبعده." },
] as const;

export default async function AboutPage() {
  const [settings, categories, brandCount] = await Promise.all([
    getStoreSettings(),
    prisma.category.findMany({
      where: { isVisible: true, isArchived: false },
      orderBy: { displayOrder: "asc" },
      take: 8,
      select: { nameAr: true, slug: true, tintColor: true },
    }),
    prisma.brand.count({ where: { isVisible: true, isArchived: false } }),
  ]);

  return (
    <div>
      <section className="bg-ay-footer py-14 text-white md:py-20">
        <div className="ay-container px-4 text-center md:px-6">
          <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-snug md:text-[42px]">
            {settings.storeNameAr} — {settings.shortDescriptionAr}
          </h1>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/shop" className="flex h-12 items-center rounded-[35px] bg-white px-6 text-sm font-semibold text-ay-heading hover:bg-[#eef4fe]">
              تسوّق الآن
            </Link>
            <Link href="/support" className="flex h-12 items-center rounded-[35px] border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10">
              تواصل معنا
            </Link>
          </div>
        </div>
      </section>

      <section className="ay-container py-12 ">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-xl font-bold text-ay-title">من نحن</h2>
          <p className="text-sm leading-8 text-ay-text">{settings.homepageMetaDescription}</p>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="bg-ay-page py-12">
          <div className="ay-container ">
            <h2 className="mb-6 text-center text-xl font-bold text-ay-title">ماذا نقدّم</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="flex items-center gap-3 rounded-[3px] border border-ay-line bg-white p-4 hover:border-ay-primary"
                >
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: c.tintColor ?? "#0B3C82" }} aria-hidden="true" />
                  <span className="text-sm font-medium text-ay-title">{c.nameAr}</span>
                </Link>
              ))}
            </div>
            {brandCount > 0 && (
              <p className="mt-6 text-center text-sm text-ay-text">
                منتجات من {brandCount} شركة موثوقة —{" "}
                <Link href="/brands" className="font-semibold text-ay-primary">
                  تصفّح الشركات
                </Link>
              </p>
            )}
          </div>
        </section>
      )}

      <section className="ay-container py-12 ">
        <h2 className="mb-6 text-center text-xl font-bold text-ay-title">لماذا {settings.storeNameAr}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="rounded-[3px] border border-ay-line bg-white p-5 text-center">
              <h3 className="mb-1.5 text-sm font-semibold text-ay-heading">{v.title}</h3>
              <p className="text-xs leading-6 text-ay-text">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ay-line bg-ay-page py-12">
        <div className="ay-container flex flex-col items-center gap-4 px-4 text-center md:px-6">
          <h2 className="text-xl font-bold text-ay-title">جاهز للتسوّق؟</h2>
          <p className="max-w-md text-sm text-ay-text">تصفّح أحدث الأجهزة والعروض، أو تواصل معنا إذا احتجت مساعدة في الاختيار.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/shop" className="flex h-12 items-center rounded-[35px] bg-ay-primary px-6 text-sm font-semibold text-white hover:bg-ay-primary-dark">
              تصفّح المتجر
            </Link>
            <Link href="/support" className="flex h-12 items-center rounded-[35px] border border-black/15 px-6 text-sm font-semibold text-ay-heading hover:border-ay-primary">
              الدعم
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
