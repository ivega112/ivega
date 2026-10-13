import type { AdminRole } from "@prisma/client";

export type Permission =
  | "products:write"
  | "products:delete"
  | "categories:write"
  | "brands:write"
  | "orders:read"
  | "orders:confirm"
  | "orders:cancel"
  | "homepage:write"
  | "settings:write"
  | "users:manage";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    "products:write",
    "products:delete",
    "categories:write",
    "brands:write",
    "orders:read",
    "orders:confirm",
    "orders:cancel",
    "homepage:write",
    "settings:write",
    "users:manage",
  ],
  MANAGER: [
    "products:write",
    "products:delete",
    "categories:write",
    "brands:write",
    "orders:read",
    "orders:confirm",
    "orders:cancel",
    "homepage:write",
    "settings:write",
  ],
  CATALOG_EDITOR: ["products:write", "categories:write", "brands:write", "orders:read"],
  ORDER_STAFF: ["orders:read", "orders:confirm", "orders:cancel"],
};

export function roleHasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
