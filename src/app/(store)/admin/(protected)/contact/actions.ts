"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { updateStoreSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activity-log";

export interface ContactSettingsState {
  ok: boolean;
  error?: string;
}

function isValidUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function updateContactSettingsAction(_prev: ContactSettingsState, formData: FormData): Promise<ContactSettingsState> {
  const user = await requirePermission("settings:write");

  const mapEmbedUrl = String(formData.get("mapEmbedUrl") ?? "").trim();
  if (!isValidUrl(mapEmbedUrl)) {
    return { ok: false, error: "رابط الخريطة غير صالح" };
  }
  const mapsUrl = String(formData.get("mapsUrl") ?? "").trim();
  if (!isValidUrl(mapsUrl)) {
    return { ok: false, error: "رابط موقع المتجر غير صالح" };
  }

  await updateStoreSettings({
    contactPhoneDisplay: String(formData.get("contactPhoneDisplay") ?? "").trim(),
    contactPhoneInternational: String(formData.get("contactPhoneInternational") ?? "").trim(),
    addressAr: String(formData.get("addressAr") ?? "").trim(),
    mapEmbedUrl,
    ...(mapsUrl ? { mapsUrl } : {}),
  });

  await logActivity({ adminUserId: user.id, action: "CONTACT_SETTINGS_UPDATE", entityType: "StoreSetting" });
  revalidatePath("/admin/contact");
  revalidatePath("/support");
  return { ok: true };
}

export async function upsertSocialLinkAction(formData: FormData) {
  const user = await requirePermission("settings:write");
  const id = String(formData.get("id") ?? "").trim();
  const platform = String(formData.get("platform") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!platform || !url || !isValidUrl(url)) throw new Error("بيانات غير صالحة");

  const link = id
    ? await prisma.socialLink.update({ where: { id }, data: { platform, url } })
    : await prisma.socialLink.create({ data: { platform, url } });

  await logActivity({ adminUserId: user.id, action: id ? "SOCIAL_LINK_UPDATE" : "SOCIAL_LINK_CREATE", entityType: "SocialLink", entityId: link.id });
  revalidatePath("/admin/contact");
  revalidatePath("/");
}

export async function deleteSocialLinkAction(id: string) {
  const user = await requirePermission("settings:write");
  await prisma.socialLink.delete({ where: { id } });
  await logActivity({ adminUserId: user.id, action: "SOCIAL_LINK_DELETE", entityType: "SocialLink", entityId: id });
  revalidatePath("/admin/contact");
  revalidatePath("/");
}

export async function updateOpeningHourAction(formData: FormData) {
  const user = await requirePermission("settings:write");
  const id = String(formData.get("id") ?? "").trim();
  const isClosed = formData.get("isClosed") === "on";
  const opensAt = String(formData.get("opensAt") ?? "").trim() || null;
  const closesAt = String(formData.get("closesAt") ?? "").trim() || null;

  await prisma.openingHour.update({ where: { id }, data: { isClosed, opensAt: isClosed ? null : opensAt, closesAt: isClosed ? null : closesAt } });
  await logActivity({ adminUserId: user.id, action: "OPENING_HOUR_UPDATE", entityType: "OpeningHour", entityId: id });
  revalidatePath("/admin/contact");
  revalidatePath("/support");
}
