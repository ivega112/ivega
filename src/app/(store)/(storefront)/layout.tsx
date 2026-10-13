import { getStoreSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { CartProvider } from "@/components/storefront/cart-context";
import { StorefrontUiProvider } from "@/components/storefront/storefront-ui";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { QuickView } from "@/components/storefront/quick-view";
import { FloatingWidgets } from "@/components/storefront/floating-widgets";

export const revalidate = 3600;

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [settings, socialLinks] = await Promise.all([
    getStoreSettings(),
    prisma.socialLink.findMany({ where: { isVisible: true }, orderBy: { displayOrder: "asc" }, select: { platform: true, url: true } }),
  ]);

  if (settings.maintenanceMode) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-bold text-text-primary">المتجر تحت الصيانة</h1>
        <p className="max-w-md text-sm text-text-muted">نعمل حالياً على تحسين المتجر، يرجى العودة لاحقاً.</p>
      </main>
    );
  }

  return (
    <CartProvider>
      <StorefrontUiProvider>
        <div className="ay-store flex min-h-screen flex-col">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:bg-ay-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
            تخطي إلى المحتوى الرئيسي
          </a>
          <SiteHeader settings={settings} />
          <main id="main-content" className="flex-1 bg-ay-page">
            {children}
          </main>
          <SiteFooter settings={settings} />
          <CartDrawer />
          <QuickView />
          <FloatingWidgets
            whatsappNumber={settings.whatsappNumber}
            showWhatsapp={settings.whatsappButtonLocations.includes("floating")}
            phoneDisplay={settings.contactPhoneDisplay}
            phoneHref={`tel:${settings.contactPhoneInternational}`}
            mapsUrl={settings.mapsUrl}
            socialLinks={socialLinks}
          />
        </div>
      </StorefrontUiProvider>
    </CartProvider>
  );
}
