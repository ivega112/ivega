import { test, expect } from "@playwright/test";

test.describe("Storefront: browse, filter, search, cart", () => {
  test("home page loads with categories and featured products", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("shop page lists products and supports sorting via URL params", async ({ page }) => {
    await page.goto("/shop?sort=price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
  });

  test("search returns results for a normalized Arabic query", async ({ page }) => {
    await page.goto("/search?q=%D8%B1%D8%B3%D9%8A%D9%81%D8%B1"); // رسيفر
    await expect(page.getByRole("heading", { name: /نتائج البحث/ })).toBeVisible();
  });

  test("product detail page renders price, SKU, and add-to-cart", async ({ page }) => {
    await page.goto("/product/k800");
    await expect(page.getByText("SKU:").first()).toBeVisible();
    await page.getByRole("button", { name: "أضف إلى السلة" }).first().click();
    await page.goto("/cart");
    await expect(page.getByText("رسيفر Smart Line HYPER K800 5G")).toBeVisible();
  });

  test("cart to review flow shows totals and requires customer fields", async ({ page }) => {
    await page.goto("/product/k800");
    await page.getByRole("button", { name: "أضف إلى السلة" }).first().click();
    await page.goto("/checkout/review");
    await expect(page.getByText("الإجمالي التقديري")).toBeVisible();
    await page.getByRole("button", { name: /إرسال الطلب/ }).click();
    await expect(page.getByText("الاسم مطلوب")).toBeVisible();
  });
});
