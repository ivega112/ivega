import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { SupportForm } from "@/components/storefront/support-form";
import Link from "next/link";

export const metadata: Metadata = { title: "الدعم" };

const DAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default async function SupportPage() {
  const [settings, hours, faqs] = await Promise.all([
    getStoreSettings(),
    prisma.openingHour.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.faqItem.findMany({ where: { isVisible: true }, orderBy: { displayOrder: "asc" }, take: 5 }),
  ]);

  return (
    <div className="ay-container py-10 ">
      <h1 className="mb-2 text-2xl font-bold text-ay-title">الدعم</h1>
      <p className="mb-8 max-w-2xl text-sm leading-7 text-ay-text">
        لأي استفسار عن جهازك أو طلبك، فريق دعم {settings.storeNameAr} جاهز لمساعدتك عبر واتساب أو النموذج أدناه — بدون الحاجة لإنشاء حساب.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-[3px] border border-ay-line bg-white p-5">
            <h2 className="text-base font-semibold text-ay-title">تواصل مباشر</h2>
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-[35px] bg-ay-whatsapp text-sm font-semibold text-white hover:opacity-90"
            >
              تواصل عبر واتساب
            </a>
            <a href={`tel:${settings.contactPhoneInternational}`} dir="ltr" className="text-center text-sm text-ay-text">
              {settings.contactPhoneDisplay}
            </a>
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer" className="text-sm text-ay-text underline-offset-4 hover:text-ay-primary hover:underline">
              {settings.addressAr}
            </a>
          </div>

          {hours.length > 0 && (
            <div className="rounded-[3px] border border-ay-line bg-white p-5">
              <h2 className="mb-3 text-base font-semibold text-ay-title">ساعات العمل</h2>
              <div className="flex flex-col gap-1.5">
                {hours.map((h) => (
                  <div key={h.id} className="flex justify-between text-sm text-ay-text">
                    <span>{DAY_LABELS[h.dayOfWeek]}</span>
                    <span>{h.isClosed ? "مغلق" : `${h.opensAt} – ${h.closesAt}`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {faqs.length > 0 && (
            <div className="rounded-[3px] border border-ay-line bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ay-title">الأسئلة الشائعة</h2>
                <Link href="/faq" className="text-xs font-semibold text-ay-primary">
                  عرض الكل
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {faqs.map((f) => (
                  <details key={f.id} className="rounded-[35px] border border-ay-line p-3">
                    <summary className="cursor-pointer text-sm font-medium text-ay-title">{f.questionAr}</summary>
                    <p className="mt-2 text-sm text-ay-text">{f.answerAr}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>

        <SupportForm whatsappNumber={settings.whatsappNumber} />
      </div>
      {settings.mapEmbedUrl && (
        <iframe
          title="موقع المتجر على الخريطة"
          src={settings.mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="mt-6 h-[360px] w-full border-0"
        />
      )}
    </div>
  );
}
