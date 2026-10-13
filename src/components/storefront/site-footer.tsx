import Image from "next/image";
import Link from "next/link";
import type { StoreSettingsData } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function SiteFooter({ settings }: { settings: StoreSettingsData }) {
  const [categories, socialLinks, openingHours] = await Promise.all([
    prisma.category.findMany({
      where: { isVisible: true, isArchived: false },
      orderBy: { displayOrder: "asc" },
      take: 6,
      select: { nameAr: true, slug: true },
    }),
    prisma.socialLink.findMany({ where: { isVisible: true }, orderBy: { displayOrder: "asc" } }),
    prisma.openingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
  ]);
  const hoursLines = summarizeHours(openingHours);

  const heading = "mb-[18px] text-[22px] font-semibold text-white";
  const link = "text-[14px] text-white/75 transition-colors hover:text-white";

  return (
    <footer className="bg-ay-footer text-white/80">
      <div className="ay-container grid grid-cols-1 gap-10 py-[60px] sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1.2fr]">
        <div className="flex flex-col items-start gap-5">
          <Link href="/" className="relative block h-[96px] w-[96px] overflow-hidden rounded-[10px] bg-white">
            <Image src={settings.logoUrl} alt={settings.storeNameEn} fill sizes="96px" className="object-contain" />
          </Link>
          <p className="max-w-[300px] text-[14px] leading-[1.8]">{settings.shortDescriptionAr}</p>
          {socialLinks.length > 0 && (
            <div className="flex gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.platform}
                  className="grid size-9 place-items-center bg-white/10 text-[13px] font-semibold text-white transition-colors hover:bg-ay-primary"
                >
                  {s.platform.slice(0, 1).toUpperCase()}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className={heading}>تواصل معنا</h2>
          <ul className="space-y-[16px] text-[15px] font-semibold text-white">
            <li>
              <a href={`tel:${settings.contactPhoneInternational}`} dir="ltr" className="hover:text-ay-primary">
                {settings.contactPhoneDisplay}
              </a>
            </li>
            {hoursLines.length > 0 ? (
              <li className="space-y-1">
                <span className="block">ساعات العمل:</span>
                {hoursLines.map((line) => (
                  <span key={line} className="block text-[14px] font-medium text-white/85">
                    {line}
                  </span>
                ))}
              </li>
            ) : (
              <li>ساعات العمل: 09:00 صباحاً - 10:00 مساءً</li>
            )}
            {settings.whatsappButtonLocations.includes("footer") && (
              <li>
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer" className="hover:text-ay-primary">
                  واتساب المتجر
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className={heading}>الأقسام</h2>
          <ul className="space-y-[10px]">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className={link}>
                  {c.nameAr}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={heading}>روابط مهمة</h2>
          <ul className="space-y-[10px]">
            <li><Link href="/shop" className={link}>المتجر</Link></li>
            <li><Link href="/shop?badge=OFFER" className={link}>العروض</Link></li>
            <li><Link href="/brands" className={link}>الشركات</Link></li>
            <li><Link href="/cart" className={link}>سلة المشتريات</Link></li>
            <li><Link href="/support" className={link}>مركز الدعم</Link></li>
            <li><Link href="/faq" className={link}>الأسئلة الشائعة</Link></li>
            <li><Link href="/policies/delivery" className={link}>معلومات التوصيل</Link></li>
            <li><Link href="/policies/payment" className={link}>طرق الدفع</Link></li>
          </ul>
        </div>

        <div>
          <a
            href={settings.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-[14px] leading-[1.7] text-white hover:text-ay-primary"
          >
            {settings.addressAr}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="ay-container flex flex-col items-center justify-between gap-3 py-5 text-[13px] text-white/70 md:flex-row">
          <span className="text-white/90">
            © {new Date().getFullYear()} <span className="font-semibold">{settings.storeNameEn}</span>. جميع الحقوق محفوظة.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/policies/privacy" className="hover:text-white">سياسة الخصوصية</Link>
            <Link href="/policies/terms" className="hover:text-white">الشروط والأحكام</Link>
            <Link href="/policies/returns" className="hover:text-white">سياسة الاستبدال والإرجاع</Link>
            <span className="flex items-center gap-2 border-s border-white/15 ps-4">
              <span className="text-[11px]">Made with</span>
              <a href="https://www.instagram.com/baynari01/" target="_blank" rel="noreferrer" title="Baynari">
                <Image src="/baynari-logo.jpg" alt="Baynari" width={40} height={40} className="size-10 rounded-full object-cover ring-1 ring-white/20" />
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const DAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** Collapses the admin's per-day opening hours into lines like "الأحد – الأربعاء: 10:00 – 21:00". */
function summarizeHours(rows: { dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null }[]): string[] {
  const valid = rows.filter((r) => r.dayOfWeek >= 0 && r.dayOfWeek <= 6);
  if (valid.length === 0) return [];
  const label = (r: (typeof valid)[number]) => (r.isClosed || !r.opensAt || !r.closesAt ? "مغلق" : `${r.opensAt} – ${r.closesAt}`);
  const lines: string[] = [];
  let start = valid[0]!;
  let prev = start;
  for (let i = 1; i <= valid.length; i++) {
    const cur = valid[i];
    if (cur && label(cur) === label(start) && cur.dayOfWeek === prev.dayOfWeek + 1) {
      prev = cur;
      continue;
    }
    const days = start.dayOfWeek === prev.dayOfWeek ? DAY_LABELS[start.dayOfWeek] : `${DAY_LABELS[start.dayOfWeek]} – ${DAY_LABELS[prev.dayOfWeek]}`;
    lines.push(`${days}: ${label(start)}`);
    if (cur) {
      start = cur;
      prev = cur;
    }
  }
  return lines;
}
