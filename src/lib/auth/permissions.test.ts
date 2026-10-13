import { describe, expect, it } from "vitest";
import { roleHasPermission } from "./permissions";

describe("roleHasPermission", () => {
  it("grants SUPER_ADMIN every permission", () => {
    expect(roleHasPermission("SUPER_ADMIN", "users:manage")).toBe(true);
    expect(roleHasPermission("SUPER_ADMIN", "orders:cancel")).toBe(true);
  });

  it("denies ORDER_STAFF catalog/settings writes", () => {
    expect(roleHasPermission("ORDER_STAFF", "products:write")).toBe(false);
    expect(roleHasPermission("ORDER_STAFF", "settings:write")).toBe(false);
    expect(roleHasPermission("ORDER_STAFF", "users:manage")).toBe(false);
  });

  it("allows ORDER_STAFF to confirm and cancel orders", () => {
    expect(roleHasPermission("ORDER_STAFF", "orders:confirm")).toBe(true);
    expect(roleHasPermission("ORDER_STAFF", "orders:cancel")).toBe(true);
  });

  it("denies CATALOG_EDITOR order confirmation and settings access", () => {
    expect(roleHasPermission("CATALOG_EDITOR", "orders:confirm")).toBe(false);
    expect(roleHasPermission("CATALOG_EDITOR", "settings:write")).toBe(false);
    expect(roleHasPermission("CATALOG_EDITOR", "products:write")).toBe(true);
  });

  it("denies MANAGER user management (super-admin only)", () => {
    expect(roleHasPermission("MANAGER", "users:manage")).toBe(false);
    expect(roleHasPermission("MANAGER", "settings:write")).toBe(true);
  });
});
