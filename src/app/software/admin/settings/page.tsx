import { prisma } from "@/software-lib/prisma";
import SettingsClient from "./SettingsClient";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Auth is enforced in admin/layout.tsx, which only renders this page's
  // subtree once a valid session exists — no separate check needed here.
  let settings: { key: string; value: string }[] = [];
  try {
    settings = await prisma.siteSetting.findMany();
  } catch (error) {
    console.error("Database error in SettingsPage:", error);
  }

  // Convert to simple key-value object
  const initialData = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إعدادات الموقع</h1>
        <p className="text-muted-foreground mt-1">إدارة النصوص والعناوين الرئيسية في الصفحة العامة.</p>
      </div>
      <SettingsClient initialData={initialData} />
    </div>
  );
}
