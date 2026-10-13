"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guard";
import { updateStoreSettings } from "@/lib/settings";
import { findUnknownTemplatePlaceholders, sanitizeWhatsappNumber } from "@/lib/whatsapp";
import { logActivity } from "@/lib/activity-log";

export interface WhatsappSettingsState {
  ok: boolean;
  error?: string;
}

export async function updateWhatsappSettingsAction(formData: FormData): Promise<WhatsappSettingsState> {
  const user = await requirePermission("settings:write");

  const whatsappDisplayNumber = String(formData.get("whatsappDisplayNumber") ?? "").trim();
  const rawNumber = String(formData.get("whatsappNumber") ?? "").trim();
  const whatsappTemplate = String(formData.get("whatsappTemplate") ?? "").trim();
  const quickRepliesRaw = String(formData.get("whatsappQuickReplies") ?? "");
  const locations = formData.getAll("whatsappButtonLocations").map(String);

  const whatsappNumber = sanitizeWhatsappNumber(rawNumber);
  if (whatsappNumber.length < 9 || whatsappNumber.length > 15) {
    return { ok: false, error: "رقم واتساب غير صالح — يجب أن يحتوي على رقم دولي صحيح" };
  }

  if (whatsappTemplate) {
    const unknown = findUnknownTemplatePlaceholders(whatsappTemplate);
    if (unknown.length > 0) {
      return { ok: false, error: `القالب يحتوي على متغيرات غير معروفة: ${unknown.map((k) => `{{${k}}}`).join(", ")}` };
    }
  }

  const whatsappQuickReplies = quickRepliesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await updateStoreSettings({
    whatsappNumber,
    whatsappDisplayNumber,
    whatsappTemplate,
    whatsappQuickReplies,
    whatsappButtonLocations: locations,
  });

  await logActivity({ adminUserId: user.id, action: "WHATSAPP_SETTINGS_UPDATE", entityType: "StoreSetting" });
  revalidatePath("/admin/whatsapp");
  revalidatePath("/");
  return { ok: true };
}
