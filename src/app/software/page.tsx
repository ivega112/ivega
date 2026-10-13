import { prisma } from "@/software-lib/prisma";
import { getSession } from "@/software-lib/auth";
import PublicClient from "./PublicClient";
import { SatelliteDish } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  let title = "iVEGA | تحميل سوفتوير ورومات الأجهزة";
  let description = "ابحث عن جهازك وحمّل ملفات السوفتوير أو الروم بسهولة وأمان.";

  try {
    const settings = await prisma.siteSetting.findMany();
    const initialSettings = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    if (initialSettings["hero_title"]) title = initialSettings["hero_title"];
    if (initialSettings["hero_subtitle"]) description = initialSettings["hero_subtitle"];
  } catch (error) {
    console.error("Database connection failed during generateMetadata:", error);
  }

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function HomePage() {
  let settings: { key: string; value: string }[] = [];
  let receivers: Awaited<ReturnType<typeof fetchReceivers>> = [];
  let isAdmin = false;

  try {
    settings = await prisma.siteSetting.findMany();
    receivers = await fetchReceivers();
    const session = await getSession();
    if (session?.adminId) {
      isAdmin = true;
    }
  } catch (error) {
    console.error("Database error in HomePage:", error);
  }

  const initialSettings = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="min-h-screen flex flex-col">
      {initialSettings["global_alert"] && (
        <div className="bg-secondary border-b border-border text-foreground py-2 px-4 text-center text-sm font-medium">
          {initialSettings["global_alert"]}
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/software" className="flex items-center gap-2">
            <SatelliteDish className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl tracking-tight text-foreground">iVEGA</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-2 items-center">
            <div className="text-center lg:text-right">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                {initialSettings["hero_title"] || "تحميل سوفتوير ورومات أجهزة iVEGA"}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {initialSettings["hero_subtitle"] ||
                  "ابحث عن جهازك وحمّل ملفات السوفتوير أو الروم بسهولة وأمان."}
              </p>
            </div>
            <div className="relative w-full aspect-[4/3]">
              {initialSettings["hero_image_url"] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={initialSettings["hero_image_url"]}
                  alt="مجموعة أجهزة استقبال iVEGA بألوان مختلفة"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src="/software.jpg"
                  alt="مجموعة أجهزة استقبال iVEGA بألوان مختلفة"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className="object-contain"
                />
              )}
            </div>
          </div>
        </section>

        <PublicClient receivers={receivers} isAdmin={isAdmin} />
      </main>

      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm mt-10">
        <div className="container mx-auto px-4">
          {initialSettings["footer_text"] || `جميع الحقوق محفوظة © iVEGA ${new Date().getFullYear()}`}
        </div>
      </footer>
    </div>
  );
}

async function fetchReceivers() {
  return prisma.receiver.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { attachments: true },
  });
}
