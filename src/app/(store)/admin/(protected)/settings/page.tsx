import Image from "next/image";
import Link from "next/link";
import { getStoreSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/auth/guard";
import { updateStoreSettingsAction } from "./actions";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">إعدادات المتجر العامة</h1>
      <p className="text-xs text-text-faint">
        لإدارة التوصيل انتقل إلى <Link href="/admin/delivery" className="text-brand-action">التوصيل</Link>، طرق الدفع إلى{" "}
        <Link href="/admin/payments" className="text-brand-action">المدفوعات</Link>، وواتساب إلى{" "}
        <Link href="/admin/whatsapp" className="text-brand-action">واتساب</Link>، وبيانات التواصل إلى{" "}
        <Link href="/admin/contact" className="text-brand-action">التواصل</Link>.
      </p>

      <form action={updateStoreSettingsAction} className="flex flex-col gap-3 rounded-card border border-border bg-white p-5">
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          اسم المتجر (عربي)
          <input name="storeNameAr" defaultValue={settings.storeNameAr} required className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          اسم المتجر (إنجليزي) — يظهر بجانب الشعار في الهيدر
          <input name="storeNameEn" defaultValue={settings.storeNameEn} dir="ltr" className="input" />
        </label>
        <div className="flex flex-col gap-2 text-sm text-text-secondary">
          شعار المتجر
          <div className="flex items-center gap-4">
            <span className="relative block size-20 flex-none overflow-hidden rounded-control border border-border bg-white">
              <Image src={settings.logoUrl} alt="الشعار الحالي" fill sizes="80px" className="object-contain p-1" />
            </span>
            <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml" className="input" />
          </div>
          <span className="text-xs text-text-faint">
            يظهر في الهيدر (وبجانبه اسم المتجر بالإنجليزي) وفي الفوتر. الأفضل صورة مربعة بخلفية شفافة (PNG). اتركه فارغاً للإبقاء على الشعار الحالي.
          </span>
        </div>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          وصف مختصر
          <textarea name="shortDescriptionAr" defaultValue={settings.shortDescriptionAr} rows={2} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          وصف الصفحة الرئيسية (SEO)
          <textarea name="homepageMetaDescription" defaultValue={settings.homepageMetaDescription} rows={2} className="input" />
        </label>
        <div className="flex flex-col gap-1 text-sm text-text-secondary">
          العملة
          <span className="input flex items-center bg-bg-subtle text-text-muted">دينار أردني (JOD) — ثابتة ولا يمكن تغييرها</span>
        </div>

        <div className="rounded-control border border-error-border bg-error-bg p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-discount-ribbon">
            <input type="checkbox" name="maintenanceMode" defaultChecked={settings.maintenanceMode} />
            وضع الصيانة (إخفاء المتجر عن الزوار مؤقتاً)
          </label>
        </div>

        <button type="submit" className="h-11 w-fit rounded-control bg-brand-action px-6 text-sm font-semibold text-white">حفظ</button>
      </form>

    </div>
  );
}
