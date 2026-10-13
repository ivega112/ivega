import { NextResponse } from "next/server";
import { prisma } from "@/software-lib/prisma";
import { logger } from "@/software-lib/logger";

export async function GET(request: Request) {
  try {
    // Basic security: Check cron auth header provided by Vercel
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete logs older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.systemLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    logger.info({ deletedCount: result.count, action: "CRON_PRUNE_LOGS" }, "Pruned old system logs");

    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error) {
    logger.error({ error, action: "CRON_PRUNE_LOGS_FAILED" }, "Failed to prune logs");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
