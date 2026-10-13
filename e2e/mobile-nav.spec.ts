import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["Pixel 7"] });

test("mobile header exposes menu, search and cart controls (reference-style header)", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");
  await expect(header.getByRole("button", { name: "القائمة" })).toBeVisible();
  await expect(header.getByRole("button", { name: "بحث" })).toBeVisible();
  await expect(header.getByRole("button", { name: /السلة/ })).toBeVisible();
});

test("wishlist feature is fully removed from the public site", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /المفضلة/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /المفضلة/ })).toHaveCount(0);
  const response = await page.goto("/wishlist");
  expect(response?.status()).toBe(404);
});

test("mobile category drawer opens from the header trigger and lists categories", async ({ page }) => {
  await page.goto("/");
  await page.locator("header").getByRole("button", { name: "القائمة" }).click();
  const drawer = page.getByRole("dialog", { name: "القائمة" });
  await expect(drawer.getByRole("link", { name: "رسيفرات وأجهزة استقبال" })).toBeVisible();
});

test("adding to cart on mobile opens the side cart and updates the header cart count", async ({ page }) => {
  await page.goto("/product/k800");
  await page.locator("main").getByRole("button", { name: "أضف إلى السلة" }).first().click();
  await expect(page.getByRole("dialog", { name: "سلة المشتريات" })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: "السلة (1)" })).toBeVisible();
});

test("mobile checkout: cart to review to WhatsApp link", async ({ page }) => {
  await page.goto("/product/k800");
  await page.getByRole("button", { name: "أضف إلى السلة" }).first().click();
  await page.goto("/checkout/review");

  await page.getByLabel("الاسم الكامل").fill("عميل موبايل");
  await page.getByLabel("رقم الهاتف").fill("0791234567");
  await page.locator('input[value="PICKUP"]').check();
  await page.getByRole("button", { name: /إرسال الطلب/ }).click();

  await expect(page.getByRole("link", { name: "إرسال الطلب عبر واتساب" })).toBeVisible();
});
