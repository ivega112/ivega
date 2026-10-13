"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guard";
import { updateStoreSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activity-log";
import { getStorageAdapter } from "@/lib/storage";

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/svg+xml"];
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

/** Uploads a new logo only when one was chosen — a plain save keeps the current logo. */
async function uploadLogoIfPresent(formData: FormData): Promise<string | null> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!LOGO_TYPES.includes(file.type)) throw new Error("صيغة الشعار غير مدعومة");
  if (file.size > LOGO_MAX_BYTES) throw new Error("حجم الشعار يتجاوز 5 ميغابايت");
  const result = await getStorageAdapter().upload(Buffer.from(await file.arrayBuffer()), file.type);
  return result.url;
}

export async function updateStoreSettingsAction(formData: FormData) {
  const user = await requirePermission("settings:write");
  const logoUrl = await uploadLogoIfPresent(formData);
  await updateStoreSettings({
    ...(logoUrl ? { logoUrl } : {}),
    storeNameAr: String(formData.get("storeNameAr") ?? ""),
    storeNameEn: String(formData.get("storeNameEn") ?? ""),
    shortDescriptionAr: String(formData.get("shortDescriptionAr") ?? ""),
    homepageMetaDescription: String(formData.get("homepageMetaDescription") ?? ""),
    // Currency is permanently JOD — not a form field, so a spoofed/extra "currency" input
    // in the submitted request can't change it either.
    currency: "JOD",
    maintenanceMode: formData.get("maintenanceMode") === "on",
  });
  await logActivity({ adminUserId: user.id, action: "STORE_SETTINGS_UPDATE", entityType: "StoreSetting" });
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
