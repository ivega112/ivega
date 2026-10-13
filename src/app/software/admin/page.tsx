import { prisma } from "@/software-lib/prisma";
import ReceiversClient from "./ReceiversClient";

export const dynamic = 'force-dynamic';

async function fetchReceivers() {
  return prisma.receiver.findMany({
    orderBy: { createdAt: "desc" },
    include: { attachments: true },
  });
}

export default async function AdminPage() {
  // Auth is enforced in admin/layout.tsx, which only renders this page's
  // subtree once a valid session exists — no separate check needed here.
  let receivers: Awaited<ReturnType<typeof fetchReceivers>> = [];

  try {
    receivers = await fetchReceivers();
  } catch (error) {
    console.error("Database error in AdminPage:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الأجهزة</h1>
        <p className="text-muted-foreground mt-1">إدارة الأجهزة وملفات Software وROM المرفقة بها.</p>
      </div>
      <ReceiversClient initialReceivers={receivers} />
    </div>
  );
}
