import { getStoreSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/auth/guard";
import { WhatsappForm } from "./whatsapp-form";

export default async function AdminWhatsappPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">إعدادات واتساب</h1>
      <WhatsappForm
        initial={{
          whatsappNumber: settings.whatsappNumber,
          whatsappDisplayNumber: settings.whatsappDisplayNumber,
          whatsappTemplate: settings.whatsappTemplate,
          whatsappQuickReplies: settings.whatsappQuickReplies,
          whatsappButtonLocations: settings.whatsappButtonLocations,
        }}
      />
    </div>
  );
}
