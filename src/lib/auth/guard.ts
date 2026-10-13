import "server-only";
import { getCurrentUser, type SessionUser } from "./session";
import { roleHasPermission, ForbiddenError, type Permission } from "./permissions";

/** Throws if there is no authenticated admin session. Use in server actions / route handlers. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Authentication required");
  return user;
}

/** Throws unless the current admin session has the given permission. Server-side — never trust UI hiding alone. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireAdmin();
  if (!roleHasPermission(user.role, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
  return user;
}
