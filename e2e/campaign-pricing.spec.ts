import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test");
  await page.getByLabel("كلمة المرور").fill(process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/admin");
}

test("percentage campaign discounts the targeted product's price everywhere it's shown, then price reverts when disabled", async ({ page, context }) => {
  await login(page);

  // K800 currently costs 42.000 د.أ (seed data) — confirm base price before touching anything.
  await page.goto("/product/k800");
  await expect(page.getByText("42.00 د.أ").first()).toBeVisible();

  await page.goto("/admin/campaigns/new");
  await page.getByLabel("اسم الحملة").fill("حملة اختبار K800");
  await page.getByLabel(/تاريخ ووقت البدء/).fill("2020-01-01T00:00");
  await page.getByLabel(/تاريخ ووقت الانتهاء/).fill("2030-01-01T00:00");
  await page.getByLabel("منتجات محددة").selectOption({ label: "رسيفر Smart Line HYPER K800 5G" });
  await page.locator('label:has-text("صفحة المنتج")').locator('input[type="checkbox"]').check();
  await page.getByLabel("نسبة الخصم %").fill("20");
  await page.getByLabel(/تفعيل الحملة/).check();
  await page.getByRole("button", { name: "حفظ الحملة" }).click();
  await expect(page).toHaveURL("/admin/campaigns");
  await expect(page.getByText("حملة اختبار K800").first()).toBeVisible();
  await expect(page.getByText("نشطة الآن").first()).toBeVisible();

  // 42 × (1 - 20/100) = 33.6
  await page.goto("/product/k800");
  await expect(page.getByText("33.60 د.أ").first()).toBeVisible();
  await expect(page.getByText("42.00 د.أ").first()).toBeVisible(); // struck-through original still shown

  // Also reflected on the shop grid.
  await page.goto("/shop?q=K800");
  await expect(page.getByText("33.60 د.أ").first()).toBeVisible();

  // Disable the campaign — base price must return automatically everywhere, immediately.
  await page.goto("/admin/campaigns");
  await page.getByRole("button", { name: "تعطيل" }).first().click();
  await page.goto("/product/k800");
  await expect(page.getByText("42.00 د.أ").first()).toBeVisible();
  // Absence check: a fresh page avoids the inert-prefetch-copy artifact documented in
  // .claude/PROJECT_MEMORY.md (Next's router prefetch cache can leave an invisible, inert
  // duplicate of a previously-visited page's content elsewhere in the DOM — harmless for a
  // real user, but a bare count-based absence assertion can see it).
  const freshPage = await context.newPage();
  await freshPage.goto("/product/k800");
  await expect(freshPage.getByText("33.60 د.أ")).toHaveCount(0);
  await freshPage.close();

  // Clean up.
  await page.goto("/admin/campaigns");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "حذف نهائي" }).first().click();
  await page.waitForTimeout(500);
});

test("overlapping campaigns on the same product never stack — the lower final price wins", async ({ page, context }) => {
  await login(page);

  async function createCampaign(name: string, percent: string) {
    await page.goto("/admin/campaigns/new");
    await page.getByLabel("اسم الحملة").fill(name);
    await page.getByLabel(/تاريخ ووقت البدء/).fill("2020-01-01T00:00");
    await page.getByLabel(/تاريخ ووقت الانتهاء/).fill("2030-01-01T00:00");
    await page.getByLabel("منتجات محددة").selectOption({ label: "رسيفر Smart Line HYPER K300" });
    await page.locator('label:has-text("صفحة المنتج")').locator('input[type="checkbox"]').check();
    await page.getByLabel("نسبة الخصم %").fill(percent);
    await page.getByLabel(/تفعيل الحملة/).check();
    await page.getByRole("button", { name: "حفظ الحملة" }).click();
    await expect(page).toHaveURL("/admin/campaigns");
  }

  // K300 costs 21.000 د.أ in seed data. 10% -> 18.90, 30% -> 14.70 — the deeper discount
  // must win regardless of which campaign was created first.
  await createCampaign("حملة أ 10%", "10");
  await createCampaign("حملة ب 30%", "30");

  await page.goto("/product/k300");
  await expect(page.getByText("14.70 د.أ").first()).toBeVisible();
  const freshPage = await context.newPage();
  await freshPage.goto("/product/k300");
  await expect(freshPage.getByText("18.90 د.أ")).toHaveCount(0);
  await freshPage.close();

  // Clean up both.
  await page.goto("/admin/campaigns");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "حذف نهائي" }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "حذف نهائي" }).first().click();
  await page.waitForTimeout(500);
});

test("final-price mode: draft campaign requires per-product price before it can be activated, and rejects a price above the original", async ({ page }) => {
  await login(page);

  await page.goto("/admin/campaigns/new");
  await page.getByLabel("اسم الحملة").fill("حملة سعر نهائي K150");
  await page.getByLabel(/تاريخ ووقت البدء/).fill("2020-01-01T00:00");
  await page.getByLabel(/تاريخ ووقت الانتهاء/).fill("2030-01-01T00:00");
  await page.getByLabel("منتجات محددة").selectOption({ label: "رسيفر Smart Line HYPER K150" });
  await page.locator('label:has-text("صفحة المنتج")').locator('input[type="checkbox"]').check();
  await page.getByRole("radio", { name: "سعر نهائي لكل منتج" }).check();
  // Saving as a draft (isEnabled left unchecked) with an incomplete/no price must succeed.
  await page.getByRole("button", { name: "حفظ الحملة" }).click();
  await expect(page).toHaveURL("/admin/campaigns");
  await expect(page.getByText("مسودة").first()).toBeVisible();

  // Edit it: the resolved target table should now show K150 (16.900 د.أ base price).
  await page.getByRole("link", { name: "تعديل" }).first().click();
  await expect(page.getByText("16.900")).toBeVisible();

  // Reject a final price above the original.
  const priceInput = page.locator('input[name^="finalPrice_"]');
  await priceInput.fill("20");
  await expect(page.getByText("أقل من السعر الأصلي")).toBeVisible();

  // Valid price + activate.
  await priceInput.fill("12.5");
  await page.getByLabel(/تفعيل الحملة/).check();
  await page.getByRole("button", { name: "حفظ الحملة" }).click();
  await expect(page).toHaveURL("/admin/campaigns");
  await expect(page.getByText("نشطة الآن").first()).toBeVisible();

  await page.goto("/product/k150");
  await expect(page.getByText("12.50 د.أ").first()).toBeVisible();

  await page.goto("/admin/campaigns");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "حذف نهائي" }).first().click();
  await page.waitForTimeout(500);
});
