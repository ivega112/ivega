import { prisma } from "@/software-lib/prisma";
import LogsClient from "./LogsClient";
import type { SystemLog } from "@prisma/client";

export const dynamic = "force-dynamic";

type LogWithAdmin = SystemLog & { adminUsername: string | null };

export default async function LogsPage() {
  // Auth is enforced in admin/layout.tsx, which only renders this page's
  // subtree once a valid session exists — no separate check needed here.
  let logs: LogWithAdmin[] = [];
  try {
    const rawLogs = await prisma.systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const admins = await prisma.admin.findMany({ select: { id: true, username: true } });
    const adminMap = new Map(admins.map((a) => [a.id, a.username]));

    logs = rawLogs.map((log) => ({
      ...log,
      adminUsername: log.adminId ? adminMap.get(log.adminId) || "مشرف محذوف" : null,
    }));
  } catch (error) {
    console.error("Database error in LogsPage:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">سجل النظام</h1>
        <p className="text-muted-foreground mt-1">تتبع جميع العمليات التي قام بها المشرفون في النظام.</p>
      </div>

      <LogsClient initialLogs={logs} />
    </div>
  );
}
