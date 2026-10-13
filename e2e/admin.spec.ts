import { test, expect } from "@playwright/test";

test("unauthenticated access to /admin redirects to login", async ({ page }) => {
  await page.goto("/admin");
  // /admin/login is now a legacy redirect; the canonical admin login lives at /login.
  await expect(page).toHaveURL(/\/login$/);
});

test("admin can log in and reach the dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test");
  await page.getByLabel("كلمة المرور").fill(process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/admin");
  await expect(page.getByRole("heading", { name: "لوحة التحكم" })).toBeVisible();
});

test("creating and publishing a product makes it visible on the public site", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test");
  await page.getByLabel("كلمة المرور").fill(process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/admin");

  // Unique slug per run so repeated test runs don't collide on the uniqueness check.
  // SKU is no longer typed at all — it's generated server-side (src/lib/sku.ts).
  const runId = Date.now();
  const slug = `e2e-test-product-${runId}`;
  const name = `منتج اختبار E2E ${runId}`;

  await page.goto("/admin/products/new");
  await page.getByLabel("الاسم بالعربي").fill(name);
  await page.getByRole("button", { name: "خيارات متقدمة: تعديل الرابط يدوياً" }).click();
  await page.locator('input[name="slug"]').fill(slug);
  await page.getByLabel("القسم").selectOption({ index: 1 });
  await page.getByLabel("الشركة").selectOption({ index: 1 });
  await page.getByLabel(/^السعر \(د\.أ\)/).fill("9.99");
  await page.getByLabel("الكمية").fill("10");
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(page).toHaveURL("/admin/products");

  await page.goto(`/product/${slug}`);
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
});

test("SKU is generated automatically and cannot be typed by the administrator", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test");
  await page.getByLabel("كلمة المرور").fill(process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/admin");

  const runId = Date.now();
  const name = `منتج اختبار SKU ${runId}`;

  await page.goto("/admin/products/new");
  // No SKU field exists to fill — only a disabled, non-editable notice (shown as the value
  // of a disabled input, matching how the edit page shows the real SKU the same way).
  await expect(page.locator('input[value="سيتم إنشاء SKU تلقائياً عند حفظ المنتج"]')).toBeVisible();
  await page.getByLabel("الاسم بالعربي").fill(name);
  await page.getByLabel("القسم").selectOption({ index: 1 });
  await page.getByLabel("الشركة").selectOption({ index: 1 });
  await page.getByLabel(/^السعر \(د\.أ\)/).fill("12.5");
  await page.getByLabel("الكمية").fill("3");
  await page.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(page).toHaveURL("/admin/products");

  // The newly-created row (top of the "newest first" list) shows a server-generated SKU.
  const skuCell = page.locator("tbody tr").filter({ hasText: name }).locator("td").nth(1);
  await expect(skuCell).toHaveText(/^IV-P-\d{6}$/);
});
