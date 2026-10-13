import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/software-components/ui/sonner";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Line | تحميل سوفتوير ورومات الأجهزة",
  description: "ابحث عن جهازك وحمّل ملفات السوفتوير أو الروم بسهولة وأمان.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/smart-line-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/images/smart-line-icon.png",
  },
  openGraph: {
    title: "Smart Line | تحميل سوفتوير ورومات الأجهزة",
    description: "ابحث عن جهازك وحمّل ملفات السوفتوير أو الروم بسهولة وأمان.",
    siteName: "Smart Line",
    images: [
      {
        url: "/images/smart-line-devices.jpg",
        alt: "مجموعة أجهزة استقبال Smart Line",
      }
    ],
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Line | تحميل سوفتوير ورومات الأجهزة",
    description: "ابحث عن جهازك وحمّل ملفات السوفتوير أو الروم بسهولة وأمان.",
    images: ["/images/smart-line-devices.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} font-sans h-full antialiased selection:bg-primary/20`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster theme="light" position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
