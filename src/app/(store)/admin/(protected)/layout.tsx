import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/permissions";
import { AdminShell, type NavGroup } from "./admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groups: NavGroup[] = [
    {
      title: "عام",
      items: [
        { href: "/admin", label: "لوحة التحكم" },
        { href: "/admin/orders", label: "الطلبات" },
      ],
    },
    {
      title: "إدارة النظام والكتالوج والمحتوى",
      items: [
        // الكتالوج
        { href: "/admin/products", label: "المنتجات" },
        { href: "/admin/categories", label: "الأقسام" },
        { href: "/admin/brands", label: "الشركات" },
        // المحتوى والتسويق
        { href: "/admin/homepage", label: "الصفحة الرئيسية" },
        { href: "/admin/campaigns", label: "الحملات" },
        { href: "/admin/reviews", label: "التقييمات" },
        // الإعدادات
        { href: "/admin/settings", label: "إعدادات عامة" },
        { href: "/admin/delivery", label: "التوصيل" },
        { href: "/admin/payments", label: "طرق الدفع" },
        { href: "/admin/whatsapp", label: "واتساب" },
        { href: "/admin/contact", label: "التواصل" },
        { href: "/admin/policies", label: "السياسات" },
        { href: "/admin/faq", label: "الأسئلة الشائعة" },
      ],
    },
  ];

  if (roleHasPermission(user.role, "users:manage")) {
    groups[1]?.items.push({ href: "/admin/users", label: "المستخدمون" });
  }

  return (
    <AdminShell groups={groups} user={{ name: user.name }}>
      {children}
    </AdminShell>
  );
}
