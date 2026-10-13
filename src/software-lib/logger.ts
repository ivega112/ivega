import pino from "pino";
import { prisma } from "./prisma";

// Create a pino logger for stdout (JSON structure)
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: { colorize: true },
        }
      : undefined,
});

/**
 * Logs an action to standard output (for external analytics like Datadog/ELK)
 * AND saves it to the database for the Admin UI audit trail.
 */
export async function logAction(
  level: "info" | "warn" | "error",
  action: string,
  message: string,
  adminId?: string | null,
  metadata?: Record<string, unknown>
) {
  // 1. Log to standard output (JSON)
  logger[level]({ action, adminId, metadata }, message);

  // 2. Save to database for internal UI
  try {
    await prisma.systemLog.create({
      data: {
        level,
        action,
        message,
        adminId: adminId || undefined,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined, // Ensure valid JSON
      },
    });
  } catch (err) {
    // Fallback if DB logging fails so we don't crash the main operation
    logger.error({ err, action: "LOG_DB_SAVE_FAILED" }, "Failed to save log to database");
  }
}
