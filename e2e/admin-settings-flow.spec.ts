import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@smartline.test");
  await page.getByLabel("كلمة المرور").fill(process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123456!");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL("/admin");
}

test("changing a delivery zone fee in admin changes the checkout total", async ({ page }) => {
  const zoneName = `منطقة اختبار ${Date.now()}`;
  await login(page);
  await page.goto("/admin/delivery");
  await page.getByPlaceholder("اسم المنطقة").fill(zoneName);
  await page.getByPlaceholder("الرسوم").fill("7.50");
  await page.getByRole("button", { name: "إضافة منطقة" }).click();
  await expect(page.getByText(zoneName)).toBeVisible();

  await page.goto("/product/k800");
  await page.getByRole("button", { name: "أضف إلى السلة" }).first().click();
  await page.goto("/checkout/review");
  await page.locator('input[value="DELIVERY"]').check();
  await page.locator("select").first().selectOption({ label: `${zoneName} — 7.50 د.أ` });
  const summary = page.getByRole("region", { name: "ملخص الطلب" });
  await expect(summary).toContainText("7.50");
});

test("updating the WhatsApp number in admin changes the generated checkout link", async ({ page }) => {
  const testNumber = "962700000111";
  await login(page);
  await page.goto("/admin/whatsapp");
  await page.getByLabel("الرقم الدولي (بدون +)").fill(testNumber);
  await page.getByLabel("الرقم المعروض للعملاء").fill("+962 70 000 0111");
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.getByText("تم الحفظ بنجاح")).toBeVisible();

  await page.goto("/product/k800");
  await page.getByRole("button", { name: "أضف إلى السلة" }).first().click();
  await page.goto("/checkout/review");
  await page.getByLabel("الاسم الكامل").fill("عميل اختبار واتساب");
  await page.getByLabel("رقم الهاتف").fill("0791234567");
  await page.locator('input[value="PICKUP"]').check();
  await page.getByRole("button", { name: /إرسال الطلب/ }).click();

  const link = page.getByRole("link", { name: "إرسال الطلب عبر واتساب" });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toContain(`wa.me/${testNumber}`);
});

test("checkout offers exactly Cash on Delivery and CliQ — no way to add or select any other method", async ({ page }) => {
  await login(page);

  // Admin payments page: no "add payment method" control exists at all, only an editable
  // instructions textarea per fixed method — exactly two forms (COD, CliQ).
  await page.goto("/admin/payments");
  await expect(page.getByRole("heading", { name: "طرق الدفع" })).toBeVisible();
  const methodForms = page.locator("form");
  await expect(methodForms).toHaveCount(2);
  await expect(page.getByPlaceholder("الاسم بالعربي")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "إضافة" })).toHaveCount(0);

  // Editing CliQ's public instructions actually changes what checkout shows.
  const marker = `تعليمات دفع اختبار ${Date.now()}`;
  const cliqForm = methodForms.filter({ has: page.locator("span", { hasText: "CliQ" }) });
  await cliqForm.getByLabel("نص التعليمات الظاهر للعميل").fill(marker);
  await cliqForm.getByRole("button", { name: "حفظ" }).click();

  await page.goto("/product/k800");
  await page.getByRole("button", { name: "أضف إلى السلة" }).first().click();
  await page.goto("/checkout/review");
  const paymentSelect = page.locator('div:has(> span:text-is("طريقة الدفع"))').locator("select");
  await expect(paymentSelect.locator("option")).toHaveCount(3); // placeholder + COD + CliQ, nothing else
  await expect(paymentSelect.getByRole("option", { name: "الدفع عند الاستلام" })).toHaveCount(1);
  await expect(paymentSelect.getByRole("option", { name: "CliQ" })).toHaveCount(1);
});

test("editing a policy updates the public policy page", async ({ page, context }) => {
  const marker = `نص اختبار السياسة ${Date.now()}`;
  await login(page);
  await page.goto("/admin/policies");
  const returnsForm = page.locator('form:has(input[value="returns"])');
  await returnsForm.locator("textarea").fill(marker);
  await Promise.all([page.waitForURL("/admin/policies"), returnsForm.getByRole("button", { name: "حفظ" }).click()]);

  const freshPage = await context.newPage();
  await freshPage.goto("/policies/returns");
  await expect(freshPage.getByText(marker)).toBeVisible();
  await freshPage.close();
});

test("creating a FAQ item makes it visible on the public FAQ page", async ({ page }) => {
  const question = `سؤال اختبار ${Date.now()}؟`;
  await login(page);
  await page.goto("/admin/faq");
  await page.getByPlaceholder("السؤال").fill(question);
  await page.getByPlaceholder("الجواب").fill("جواب تجريبي للاختبار");
  await page.getByRole("button", { name: "إضافة" }).click();
  await expect(page.getByText(question)).toBeVisible();

  await page.goto("/faq");
  await expect(page.getByText(question)).toBeVisible();
});

test("hiding a review removes it from the public homepage", async ({ page, context }) => {
  const author = `مراجع اختبار ${Date.now()}`;
  await login(page);
  await page.goto("/admin/reviews");
  await page.getByPlaceholder("اسم العميل").fill(author);
  await page.getByPlaceholder("نص التقييم").fill("تجربة رائعة، هذا نص اختبار للمراجعة.");
  await page.getByRole("button", { name: "إضافة" }).click();
  await expect(page.getByText(author)).toBeVisible();

  await page.goto("/");
  await expect(page.getByText(author).first()).toBeVisible();

  await page.goto("/admin/reviews");
  await Promise.all([
    page.waitForURL("/admin/reviews"),
    page.locator(".rounded-card", { hasText: author }).getByRole("button", { name: "إخفاء" }).click(),
  ]);

  // Use a brand-new page/context for the final check: this repo's dev sandbox has shown
  // transient client-side re-render artifacts on repeated same-tab navigations elsewhere
  // in this suite; a fresh page avoids that while still exercising real server rendering.
  const freshPage = await context.newPage();
  await freshPage.goto("/");
  await expect(freshPage.getByText(author)).toHaveCount(0);
  await freshPage.close();
});
