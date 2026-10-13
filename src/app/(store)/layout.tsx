import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getStoreSettings } from "@/lib/settings";
import { Toaster } from "sonner";

// All storefront data (catalog, settings, homepage content) is admin-editable and must
// always reflect current DB state — never statically cached across deploys.
export const dynamic = "force-dynamic";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const description = settings.homepageMetaDescription || "متجر سمارت لاين (Smart Line) لبيع أحدث الأجهزة الكهربائية والشاشات ورسيفرات البث بأسعار منافسة.";
  
  return {
    title: { default: settings.storeNameAr, template: `%s | ${settings.storeNameAr}` },
    description,
    keywords: ["سمارت لاين", "Smart Line", "رسيفرات", "شاشات", "اشتراكات", "صيانة", "ايفيقا", "أجهزة استقبال", "أندرويد", "تلفزيونات", "إلكترونيات", "رسيفرات IPTV", "الأردن"],
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
    openGraph: {
      title: settings.storeNameAr,
      description,
      siteName: settings.storeNameAr,
      images: [
        {
          url: settings.logoUrl || "/smartline-logo.png",
          width: 1200,
          height: 630,
          alt: settings.storeNameAr,
        },
      ],
      locale: "ar_JO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: settings.storeNameAr,
      description,
      images: [settings.logoUrl || "/smartline-logo.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return (
    <html lang="ar" dir={settings.direction} className={`${plexArabic.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" dir="rtl" richColors />
      </body>
    </html>
  );
}
