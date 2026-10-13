import "server-only";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";
import { createSession, setSessionCookie } from "./session";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 1000 * 60 * 15; // 15 minutes

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "invalid_credentials" | "locked" | "inactive" };

export async function attemptLogin(
  email: string,
  password: string,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<LoginResult> {
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user) {
    // Constant-ish work to avoid trivial email enumeration via timing.
    await verifyPassword("$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", password);
    return { ok: false, reason: "invalid_credentials" };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, reason: "locked" };
  }

  if (!user.isActive) {
    return { ok: false, reason: "inactive" };
  }

  const valid = await verifyPassword(user.passwordHash, password);

  if (!valid) {
    const failedAttempts = user.failedAttempts + 1;
    const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedAttempts, lockedUntil },
    });
    return { ok: false, reason: lockedUntil ? "locked" : "invalid_credentials" };
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null },
  });

  const token = await createSession(user.id, meta);
  await setSessionCookie(token);
  await prisma.activityLog.create({
    data: { adminUserId: user.id, action: "LOGIN", entityType: "AdminUser", entityId: user.id },
  });

  return { ok: true };
}
