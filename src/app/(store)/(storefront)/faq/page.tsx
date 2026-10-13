import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = { title: "الأسئلة الشائعة" };

export default async function FaqPage() {
  const items = await prisma.faqItem.findMany({ where: { isVisible: true }, orderBy: { displayOrder: "asc" } });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.questionAr,
      acceptedAnswer: { "@type": "Answer", text: i.answerAr },
    })),
  };

  return (
    <div className="ay-container py-10 ">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <h1 className="mb-6 text-2xl font-bold text-ay-title">الأسئلة الشائعة</h1>
      <div className="flex flex-col gap-3">
        {items.map((i) => (
          <details key={i.id} className="rounded-[3px] border border-ay-line bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ay-title">{i.questionAr}</summary>
            <p className="mt-2 text-sm text-ay-text">{i.answerAr}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
