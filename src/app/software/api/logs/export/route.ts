import { NextResponse } from "next/server";
import { prisma } from "@/software-lib/prisma";
import { getSession } from "@/software-lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Create CSV header
    let csv = "\uFEFF"; // BOM for Arabic Excel support
    csv += "ID,Level,Action,Message,AdminID,CreatedAt,Metadata\n";

    // Escape CSV values
    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Add rows
    for (const log of logs) {
      const row = [
        log.id,
        log.level,
        log.action,
        log.message,
        log.adminId || "SYSTEM",
        new Date(log.createdAt).toISOString(),
        log.metadata ? JSON.stringify(log.metadata) : "",
      ];
      csv += row.map(escapeCsv).join(",") + "\n";
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="system_logs_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export logs" }, { status: 500 });
  }
}
