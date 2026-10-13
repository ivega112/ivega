import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { updatePolicyAction } from "./actions";

const POLICIES = [
  { slug: "delivery", label: "سياسة التوصيل" },
  { slug: "payment", label: "طرق الدفع" },
  { slug: "returns", label: "سياسة الاستبدال والإرجاع" },
  { slug: "privacy", label: "سياسة الخصوصية" },
  { slug: "terms", label: "الشروط والأحكام" },
];

export default async function AdminPoliciesPage() {
  await requireAdmin();
  const pages = await prisma.policyPage.findMany();
  const bySlug = new Map(pages.map((p) => [p.slug, p]));

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">صفحات السياسات</h1>
      {POLICIES.map((p) => {
        const page = bySlug.get(p.slug);
        return (
          <form key={p.slug} action={updatePolicyAction} className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
            <input type="hidden" name="slug" value={p.slug} />
            <span className="text-sm font-semibold text-text-primary">{p.label}</span>
            <label className="flex flex-col gap-1 text-xs text-text-secondary">
              العنوان
              <input name="titleAr" defaultValue={page?.titleAr ?? p.label} required className="input" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-secondary">
              المحتوى
              <textarea name="bodyAr" defaultValue={page?.bodyAr ?? ""} rows={5} required className="input" />
            </label>
            <button type="submit" className="h-10 w-fit rounded-control bg-brand-action px-5 text-sm font-semibold text-white">حفظ</button>
          </form>
        );
      })}
    </div>
  );
}
