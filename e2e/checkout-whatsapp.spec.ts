import { test, expect } from "@playwright/test";

test("completing checkout creates an order and produces a wa.me link", async ({ page }) => {
  await page.goto("/product/k800");
  await page.getByRole("button", { name: "أضف إلى السلة" }).first().click();
  await page.goto("/checkout/review");

  await page.getByLabel("الاسم الكامل").fill("أحمد تجريبي");
  await page.getByLabel("رقم الهاتف").fill("0791234567");
  await page.locator('input[value="PICKUP"]').check();

  await page.getByRole("button", { name: /إرسال الطلب/ }).click();

  const whatsappLink = page.getByRole("link", { name: "إرسال الطلب عبر واتساب" });
  await expect(whatsappLink).toBeVisible();
  const href = await whatsappLink.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
});
