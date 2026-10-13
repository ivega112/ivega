import { test, expect } from "@playwright/test";

/** On narrow screens the shop sidebar filters sit behind the "إظهار الفلاتر" button (reference layout). */
async function openFiltersIfCollapsed(page: import("@playwright/test").Page) {
  // The sidebar is inline from 1024px up; below that it is collapsed behind the toggle.
  if ((page.viewportSize()?.width ?? 1280) >= 1024) return;
  const toggle = page.getByRole("button", { name: "إظهار الفلاتر" });
  const panel = page.getByRole("dialog", { name: "الفلاتر" });
  // Retry until hydrated: a click that lands before hydration has no handler yet.
  await expect(async () => {
    await toggle.click();
    await expect(panel.getByRole("heading", { name: "الشركات" })).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15000 });
}

test.describe("desktop nav", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("active state follows the current route, not stuck on 'جميع الأقسام'", async ({ page }) => {
    const mainNav = page.getByLabel("التنقل الرئيسي");
    const allCategories = mainNav.getByRole("link", { name: "جميع الأقسام" });

    // "/" is the default landing page — الرئيسية should be active there, not جميع الأقسام.
    await page.goto("/");
    await expect(allCategories).not.toHaveAttribute("aria-current", "page");
    await expect(mainNav.getByRole("link", { name: "الرئيسية" })).toHaveAttribute("aria-current", "page");

    // Offers was merged into /shop as a badge=OFFER filter — /offers now redirects there,
    // where "جميع الأقسام" (the shop's own nav entry) is the active item, same as plain /shop.
    await page.goto("/offers");
    await expect(page).toHaveURL(/\/shop\?badge=OFFER/);
    await expect(allCategories).toHaveAttribute("aria-current", "page");

    await page.goto("/shop");
    await expect(allCategories).toHaveAttribute("aria-current", "page");

    await page.goto("/about");
    await expect(allCategories).not.toHaveAttribute("aria-current", "page");
    await expect(mainNav.getByRole("link", { name: "من نحن" })).toHaveAttribute("aria-current", "page");
  });

  test("Home nav link is present and navigates to /", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("link", { name: "الرئيسية" }).first().click();
    await expect(page).toHaveURL("/");
  });
});

test("homepage brand circle navigates to a filtered, refresh-safe shop URL", async ({ page }) => {
  await page.goto("/");
  const firstBrandLink = page.locator('a[href^="/shop?brand="]').first();
  const href = await firstBrandLink.getAttribute("href");
  expect(href).toMatch(/^\/shop\?brand=[a-z0-9-]+$/);

  await firstBrandLink.click();
  await expect(page).toHaveURL(href!);
  await page.reload();
  await expect(page).toHaveURL(href!);

  await openFiltersIfCollapsed(page);
  const brandGroup = page.getByRole("radiogroup", { name: "تصفية حسب الشركة" });
  await expect(brandGroup.getByRole("radio", { checked: true })).toBeVisible();
});

test("switching brands from within a brand's own filtered page (/brands/[slug]) actually changes the products shown", async ({ page }) => {
  // Regression test: /brands/[slug] filters by its route segment, while the shared brand
  // circle row toggles a "brand" query param — clicking a different brand here used to just
  // add a useless "?brand=" to the URL while the page kept showing the original route's brand.
  await page.goto("/brands/smart-line");
  await expect(page.getByRole("heading", { name: "Smart Line", exact: true })).toBeVisible();
  const productHrefsBefore = await page.locator('a[href^="/product/"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));

  await openFiltersIfCollapsed(page);
  const brandGroup = page.getByRole("radiogroup", { name: "تصفية حسب الشركة" });
  await brandGroup.getByRole("radio", { name: "QUBIT" }).click();

  await expect(page).toHaveURL("/brands/qubit");
  await expect(page.getByRole("heading", { name: "QUBIT", exact: true })).toBeVisible();
  await openFiltersIfCollapsed(page);
  const productHrefsAfter = await page.locator('a[href^="/product/"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(productHrefsAfter).not.toEqual(productHrefsBefore);
  await expect(brandGroup.getByRole("radio", { name: "QUBIT" })).toHaveAttribute("aria-checked", "true");
});

test("price sorting is numerically correct and deterministic across repeated loads", async ({ page }) => {
  await page.goto("/shop?sort=price-asc");
  const main = page.locator("main");
  const cardPrices = main.locator('.grid ins[aria-label="السعر الحالي"]');
  await expect(cardPrices.first()).toBeVisible();
  const prices1 = await cardPrices.allTextContents();

  await page.goto("/shop?sort=price-asc");
  await expect(cardPrices.first()).toBeVisible();
  const prices2 = await cardPrices.allTextContents();

  expect(prices1).toEqual(prices2);
  expect(prices1.length).toBeGreaterThan(0);

  const numeric = prices1.map((p) => parseFloat(p));
  const sorted = [...numeric].sort((a, b) => a - b);
  expect(numeric).toEqual(sorted);
});

test("search suggestions appear while typing and Enter navigates to /shop with the query", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /ابحث عن/ }).click();
  const input = page.getByLabel("ابحث عن منتج، ماركة، أو موديل");
  await input.fill("رسيفر");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option").first()).toBeVisible();

  await input.press("Enter");
  await expect(page).toHaveURL(/\/shop\?q=/);
});

test("/offers redirects to /shop?badge=OFFER with no broken link, and the shop's العروض chip filters to only OFFER-badged products", async ({ page }) => {
  const response = await page.goto("/offers");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/shop\?badge=OFFER/);

  await openFiltersIfCollapsed(page);
  const offersChip = page.getByRole("button", { name: "العروض" });
  await expect(offersChip).toHaveAttribute("aria-pressed", "true");

  // Toggling off should drop the query param and go back to the unfiltered shop.
  await offersChip.click();
  await expect(page).toHaveURL("/shop");
  await openFiltersIfCollapsed(page);
  await expect(offersChip).toHaveAttribute("aria-pressed", "false");
});

test("/contact redirects to /support with no broken link", async ({ page }) => {
  const response = await page.goto("/contact");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL("/support");
});

test("support form opens a WhatsApp link with the entered details encoded", async ({ page, context }) => {
  await page.goto("/support");
  await page.getByLabel("الاسم").fill("عميل اختبار");
  await page.getByLabel("رقم الهاتف").fill("0791234567");
  await page.getByLabel("الرسالة").fill("هل يوجد ضمان على هذا الجهاز؟");

  // Capture the exact URL the app asks to open, then block it from actually leaving for
  // wa.me's live redirect target — we're verifying what this app generates, not exercising
  // WhatsApp's own infrastructure.
  let capturedUrl: string | null = null;
  await context.route("**/*", (route) => {
    const reqUrl = route.request().url();
    if (reqUrl.includes("wa.me")) {
      capturedUrl = reqUrl;
      return route.abort();
    }
    return route.continue();
  });

  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "إرسال عبر واتساب" }).click(),
  ]);
  await popup.waitForLoadState("domcontentloaded").catch(() => {});
  await popup.close().catch(() => {});

  const url = capturedUrl;
  expect(url).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  const decoded = decodeURIComponent(url!.split("?text=")[1] ?? "");
  expect(decoded).toContain("عميل اختبار");
  expect(decoded).toContain("0791234567");
});

test("product page shows the short spec above add-to-cart and the full description in the الوصف tab", async ({ page }) => {
  await page.goto("/product/k800");
  const descTab = page.getByRole("tab", { name: "الوصف" });
  await expect(descTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).not.toBeEmpty();

  const order = await page.evaluate(() => {
    const title = document.querySelector("main h1");
    const btn = Array.from(document.querySelectorAll("main button")).find((b) => b.textContent?.includes("أضف إلى السلة"));
    const tabs = document.querySelector('[role="tablist"]');
    if (!title || !btn || !tabs) return null;
    const titleFirst = title.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING;
    const tabsAfter = btn.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING;
    return titleFirst && tabsAfter ? "title-button-tabs" : "other";
  });
  expect(order).toBe("title-button-tabs");
});
