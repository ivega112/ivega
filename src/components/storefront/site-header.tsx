import type { StoreSettingsData } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { HeaderShell } from "./header-shell";

export async function SiteHeader({ settings }: { settings: StoreSettingsData }) {
  const categories = await prisma.category.findMany({
    where: { isVisible: true, isArchived: false },
    orderBy: { displayOrder: "asc" },
    select: { id: true, nameAr: true, slug: true },
  });

  return (
    <HeaderShell
      logoUrl={settings.logoUrl}
      storeName={settings.storeNameEn}
      phoneDisplay={settings.contactPhoneDisplay}
      phoneHref={`tel:${settings.contactPhoneInternational}`}
      categories={categories}
      whatsappHref={settings.whatsappButtonLocations.includes("header") ? `https://wa.me/${settings.whatsappNumber}` : null}
    />
  );
}
