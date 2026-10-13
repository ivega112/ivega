import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test");
  await page.getByLabel("كلمة المرور").fill(process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/admin");
}

test("assigning a product to an additional category makes it appear on that category's public page too", async ({ page }) => {
  await login(page);

  // k800's own /category page (its primary category, receivers) — confirm the product is
  // there before touching anything, and that androidtv does NOT have it yet.
  await page.goto("/category/receivers");
  await expect(page.getByRole("link", { name: /HYPER K800/ }).first()).toBeVisible();
  await page.goto("/category/androidtv");
  await expect(page.getByRole("link", { name: /HYPER K800/ })).toHaveCount(0);

  // Find k800's product id via the admin list, then open its edit page and add "أجهزة
  // أندرويد TV" as an additional category.
  await page.goto("/admin/products?q=K800");
  await page.getByRole("link", { name: /HYPER K800/ }).first().click();
  await expect(page).toHaveURL(/\/admin\/products\/.+/);

  const additionalSelect = page.getByLabel("أقسام إضافية");
  await additionalSelect.selectOption({ label: "أجهزة أندرويد TV" });
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(page).toHaveURL("/admin/products");

  // Now it must show on BOTH category pages — primary untouched, additional now included.
  await page.goto("/category/androidtv");
  await expect(page.getByRole("link", { name: /HYPER K800/ }).first()).toBeVisible();
  await page.goto("/category/receivers");
  await expect(page.getByRole("link", { name: /HYPER K800/ }).first()).toBeVisible();

  // Clean up: remove the additional assignment again so this test is repeatable and
  // doesn't leave cross-category noise in the demo catalog.
  await page.goto("/admin/products?q=K800");
  await page.getByRole("link", { name: /HYPER K800/ }).first().click();
  await page.getByLabel("أقسام إضافية").selectOption([]);
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(page).toHaveURL("/admin/products");

  await page.goto("/category/androidtv");
  await expect(page.getByRole("link", { name: /HYPER K800/ })).toHaveCount(0);
});

test("category admin page: assigning a product via the category's own product picker works both ways", async ({ page }) => {
  await login(page);

  await page.goto("/admin/categories");
  await page.getByRole("link", { name: "أجهزة أندرويد TV" }).click();
  await expect(page).toHaveURL(/\/admin\/categories\/.+/);

  const row = page.locator("label", { hasText: "HYPER K800" });
  await expect(row.locator('input[type="checkbox"]')).not.toBeChecked();
  await row.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  // The action redirects back with ?saved=1 on success — a concrete, waitable signal that
  // the mutation actually committed (this form has no other client-visible feedback).
  await expect(page).toHaveURL(/\?saved=1/);
  await expect(page.getByRole("status")).toContainText("تم الحفظ");
  await expect(page.locator("label", { hasText: "HYPER K800" }).locator('input[type="checkbox"]')).toBeChecked();

  await page.goto("/category/androidtv");
  await expect(page.getByRole("link", { name: /HYPER K800/ }).first()).toBeVisible();

  // Clean up via the same picker.
  await page.goto("/admin/categories");
  await page.getByRole("link", { name: "أجهزة أندرويد TV" }).click();
  const row2 = page.locator("label", { hasText: "HYPER K800" });
  await row2.locator('input[type="checkbox"]').uncheck();
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(page).toHaveURL(/\?saved=1/);
  await expect(page.locator("label", { hasText: "HYPER K800" }).locator('input[type="checkbox"]')).not.toBeChecked();

  await page.goto("/category/androidtv");
  await expect(page.getByRole("link", { name: /HYPER K800/ })).toHaveCount(0);
});
