"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { hashPassword, isPasswordStrongEnough } from "@/lib/auth/password";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";

export interface UserActionState {
  ok: boolean;
  error?: string;
}

async function countActiveSuperAdmins(excludeId?: string): Promise<number> {
  return prisma.adminUser.count({
    where: { role: "SUPER_ADMIN", isActive: true, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
}

export async function createUserAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requirePermission("users:manage");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email) return { ok: false, error: "الاسم والبريد الإلكتروني مطلوبان" };
  if (!isPasswordStrongEnough(password)) return { ok: false, error: "كلمة المرور يجب أن تكون 12 حرفاً على الأقل" };

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "البريد الإلكتروني مستخدم مسبقاً" };

  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.create({ data: { name, email, passwordHash, role: "SUPER_ADMIN", isActive: true } });

  await logActivity({ adminUserId: actor.id, action: "USER_CREATE", entityType: "AdminUser", entityId: user.id, metadata: { role: "SUPER_ADMIN" } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserDetailsAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requirePermission("users:manage");
  const userId = String(formData.get("userId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) return { ok: false, error: "الاسم والبريد الإلكتروني مطلوبان" };
  const emailOwner = await prisma.adminUser.findFirst({ where: { email, NOT: { id: userId } }, select: { id: true } });
  if (emailOwner) return { ok: false, error: "البريد الإلكتروني مستخدم مسبقاً" };
  await prisma.adminUser.update({ where: { id: userId }, data: { name, email, role: "SUPER_ADMIN", isActive: true } });
  await logActivity({ adminUserId: actor.id, action: "USER_DETAILS_UPDATE", entityType: "AdminUser", entityId: userId });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<void> {
  const actor = await requirePermission("users:manage");
  if (userId === actor.id) throw new Error("لا يمكنك حذف الحساب الذي تستخدمه حالياً");
  if ((await countActiveSuperAdmins(userId)) === 0) throw new Error("لا يمكن حذف آخر مدير عام في النظام");
  await prisma.adminUser.delete({ where: { id: userId } });
  await logActivity({ adminUserId: actor.id, action: "USER_DELETE", entityType: "AdminUser", entityId: userId });
  revalidatePath("/admin/users");
}

export async function resetUserPasswordAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requirePermission("users:manage");
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!isPasswordStrongEnough(password)) return { ok: false, error: "كلمة المرور يجب أن تكون 12 حرفاً على الأقل" };

  const passwordHash = await hashPassword(password);
  await prisma.adminUser.update({ where: { id: userId }, data: { passwordHash, failedAttempts: 0, lockedUntil: null } });
  await revokeAllSessionsForUser(userId);

  await logActivity({ adminUserId: actor.id, action: "USER_PASSWORD_RESET", entityType: "AdminUser", entityId: userId });
  revalidatePath("/admin/users");
  return { ok: true };
}
