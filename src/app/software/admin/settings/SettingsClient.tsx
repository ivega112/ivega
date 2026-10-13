"use client";

import { useState } from "react";
import { Button } from "@/software-components/ui/button";
import { Input } from "@/software-components/ui/input";
import { Label } from "@/software-components/ui/label";
import { toast } from "sonner";
import { updateSiteSetting, updateHeroImage, getUploadUrl } from "../actions";
import { Card, CardContent } from "@/software-components/ui/card";
import { Save } from "lucide-react";
import { validateImageFile } from "@/software-lib/uploads";
import { getSupabaseBrowserClient, STORAGE_BUCKET } from "@/software-lib/supabase-browser";

export default function SettingsClient({ initialData }: { initialData: Record<string, string> }) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const heroImageFile = formData.get("hero_image") as File;
    formData.delete("hero_image");

    try {
      if (heroImageFile && heroImageFile.size > 0) {
        const error = validateImageFile(heroImageFile);
        if (error) throw new Error(error);

        const supabaseClient = getSupabaseBrowserClient();
        const { path } = await getUploadUrl("images", heroImageFile.name);
        
        const { error: uploadError } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(path, heroImageFile, { upsert: true });
        
        if (uploadError) {
          throw new Error(`تعذر رفع الصورة: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        await updateHeroImage(publicUrl, path);
      }

      for (const [key, value] of formData.entries()) {
        await updateSiteSetting(key, value.toString());
      }
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <Label>صورة الغلاف الرئيسية (Hero)</Label>
            {initialData["hero_image_url"] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initialData["hero_image_url"]}
                alt="صورة الغلاف الحالية"
                className="w-40 h-28 object-contain rounded-md border border-border bg-secondary"
              />
            )}
            <Input name="hero_image" type="file" accept="image/jpeg,image/png,image/webp" />
            <p className="text-xs text-muted-foreground">
              JPG, PNG أو WEBP، حتى 5 ميجابايت. اتركه فارغاً للحفاظ على الصورة الحالية.
            </p>
          </div>

          <div className="space-y-2">
            <Label>عنوان الموقع الرئيسي (Hero Title)</Label>
            <Input name="hero_title" defaultValue={initialData["hero_title"] || "تحميل سوفتوير ورومات أجهزة Smart Line"} />
          </div>

          <div className="space-y-2">
            <Label>النص الفرعي (Hero Subtitle)</Label>
            <textarea
              name="hero_subtitle"
              defaultValue={initialData["hero_subtitle"] || "ابحث عن جهازك وحمّل ملفات السوفتوير أو الروم بسهولة وأمان."}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label>إعلان عام (تنبيه أعلى الموقع)</Label>
            <Input name="global_alert" defaultValue={initialData["global_alert"] || ""} placeholder="اتركه فارغاً لإخفائه" />
          </div>

          <div className="space-y-2">
            <Label>نص التذييل (Footer Text)</Label>
            <Input name="footer_text" defaultValue={initialData["footer_text"] || `جميع الحقوق محفوظة © Smart Line ${new Date().getFullYear()}`} />
          </div>

          <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4" />
            {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
