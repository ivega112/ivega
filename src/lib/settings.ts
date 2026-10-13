import "server-only";
import { prisma } from "@/lib/prisma";

export interface StoreSettingsData {
  storeNameAr: string;
  storeNameEn: string;
  shortDescriptionAr: string;
  homepageMetaDescription: string;
  logoUrl: string;
  currency: string;
  decimalPlaces: number;
  defaultLanguage: "ar" | "en";
  direction: "rtl" | "ltr";
  englishToggleEnabled: boolean;
  maintenanceMode: boolean;
  contactPhoneDisplay: string;
  contactPhoneInternational: string;
  addressAr: string;
  mapEmbedUrl: string;
  /** Link opened by the store address (footer / contact list). */
  mapsUrl: string;
  whatsappNumber: string;
  whatsappDisplayNumber: string;
  whatsappTemplate: string;
  whatsappQuickReplies: string[];
  whatsappButtonLocations: string[];
}

export const DEFAULT_STORE_SETTINGS: StoreSettingsData = {
  storeNameAr: "آي فيغا",
  storeNameEn: "Smart Line",
  shortDescriptionAr: "متجر Smart Line للإلكترونيات والأجهزة الكهربائية في الأردن",
  homepageMetaDescription:
    "متجر Smart Line للإلكترونيات والأجهزة الكهربائية في الأردن: رسيفرات وأجهزة أندرويد وشاشات وكيبلات وصوتيات ومراوح وأجهزة منزلية.",
  logoUrl: "/smartline-logo.png",
  currency: "JOD",
  decimalPlaces: 2,
  defaultLanguage: "ar",
  direction: "rtl",
  englishToggleEnabled: false,
  maintenanceMode: false,
  contactPhoneDisplay: "+962 79 571 8978",
  contactPhoneInternational: "+962795718978",
  addressAr: "عمّان — مرج الحمام، إسكان عالية — مقابل شركة أورنج",
  mapEmbedUrl: "",
  mapsUrl: "https://maps.app.goo.gl/rwMeDNcGssYtRLd58",
  whatsappNumber: "962795718978",
  whatsappDisplayNumber: "+962 79 571 8978",
  whatsappTemplate: "",
  whatsappQuickReplies: ["هل الجهاز متوفر؟", "ما هي مدة الضمان؟", "هل يوجد توصيل لمنطقتي؟"],
  whatsappButtonLocations: ["header", "footer", "product", "floating"],
};

let cache: { data: StoreSettingsData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getStoreSettings(): Promise<StoreSettingsData> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;

  const row = await prisma.storeSetting.findUnique({ where: { id: "singleton" } });
  const data: StoreSettingsData = row
    ? { ...DEFAULT_STORE_SETTINGS, ...(row.data as Partial<StoreSettingsData>) }
    : DEFAULT_STORE_SETTINGS;

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export async function updateStoreSettings(patch: Partial<StoreSettingsData>): Promise<StoreSettingsData> {
  const current = await getStoreSettings();
  const next = { ...current, ...patch };
  await prisma.storeSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", data: next },
    update: { data: next },
  });
  cache = null;
  return next;
}
