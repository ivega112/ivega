import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/admin");
}

test("a newly created dashboard user is a general administrator and can be deleted", async ({ page, browser }) => {
  const email = `admin-${Date.now()}@example.com`;
  const password = "AdminPassword123!";

  await login(page, process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test", process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await expect(page).toHaveURL("/admin");
  await page.goto("/admin/users");

  const createForm = page.locator("form", { hasText: "مستخدم جديد" });
  await createForm.getByPlaceholder("الاسم الكامل").fill("مدير اختبار");
  await createForm.getByPlaceholder("البريد الإلكتروني").fill(email);
  await createForm.getByPlaceholder("كلمة المرور (12 حرفاً على الأقل)").fill(password);
  await createForm.getByRole("button", { name: "إنشاء" }).click();
  await expect(page.getByText("تم إنشاء المستخدم")).toBeVisible();

  const newContext = await browser.newContext();
  const newAdminPage = await newContext.newPage();
  await login(newAdminPage, email, password);
  await newAdminPage.goto("/admin/users");
  await expect(newAdminPage.getByRole("heading", { name: "المستخدمون" })).toBeVisible();
  await newContext.close();

  const row = page.locator("tr", { hasText: email });
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "حذف" }).click();
  await expect(row).toHaveCount(0);
});

test("the currently signed-in account cannot delete itself", async ({ page }) => {
  await login(page, process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test", process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await page.goto("/admin/users");
  const selfRow = page.locator("tr", { hasText: "(أنت)" });
  await expect(selfRow.getByRole("button", { name: "حذف" })).toBeDisabled();
});
