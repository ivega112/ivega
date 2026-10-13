import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test");
  await page.getByLabel("كلمة المرور").fill(process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/admin");
}

test("confirming an order decrements stock; cancelling restores it exactly once", async ({ page }) => {
  // Place an order as a customer for a known-quantity seeded product (k100).
  await page.goto("/product/k100");
  await page.getByRole("button", { name: "أضف إلى السلة" }).first().click();
  await page.goto("/checkout/review");
  await page.getByLabel("الاسم الكامل").fill("عميل اختبار المخزون");
  await page.getByLabel("رقم الهاتف").fill("0781234567");
  await page.locator('input[value="PICKUP"]').check();
  await page.getByRole("button", { name: /إرسال الطلب/ }).click();
  await expect(page.getByText(/تم إنشاء طلبك رقم/)).toBeVisible();
  const orderText = await page.getByText(/تم إنشاء طلبك رقم/).textContent();
  const orderNumber = orderText?.match(/IV-[\d-]+-[A-Z0-9]+/)?.[0];
  expect(orderNumber).toBeTruthy();

  await login(page);
  await page.goto("/admin/orders");
  await page.getByText(orderNumber!).click();

  // Confirming reserves stock and moves the order straight to "قيد التجهيز".
  await page.getByRole("button", { name: /تأكيد وبدء التجهيز/ }).click();
  await expect(page.getByText("قيد التجهيز", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "إلغاء الطلب" }).click();
  await expect(page.getByText("ملغي", { exact: true })).toBeVisible();
});
