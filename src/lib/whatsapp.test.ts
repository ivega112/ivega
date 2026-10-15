import { describe, expect, it } from "vitest";
import { buildWhatsappMessage, buildWhatsappUrl, sanitizeWhatsappNumber } from "./whatsapp";

const baseInput = {
  orderNumber: "IV-260101-AB12",
  items: [{ name: "رسيفر K800", model: "K800", quantity: 2, unitPrice: 42, lineTotal: 84 }],
  subtotal: 84,
  discountTotal: 0,
  deliveryFee: 3,
  total: 87,
  deliveryLabel: "عمّان",
  paymentLabel: "الدفع عند الاستلام",
  customerName: "أحمد",
  customerPhone: "0791234567",
};

describe("buildWhatsappMessage", () => {
  it("includes order number, items, and totals", () => {
    const msg = buildWhatsappMessage(baseInput);
    expect(msg).toContain("IV-260101-AB12");
    expect(msg).toContain("رسيفر K800");
    expect(msg).toContain("رقم الموديل: K800");
    expect(msg).not.toContain("IV-K800");
    expect(msg).toContain("87.00");
    expect(msg).toContain("أحمد");
  });

  it("falls back gracefully when address/notes are missing", () => {
    const msg = buildWhatsappMessage(baseInput);
    expect(msg).toContain("—");
  });

  it("substitutes into a custom admin-provided template", () => {
    const msg = buildWhatsappMessage({ ...baseInput, template: "طلب {{orderNumber}} بقيمة {{total}}" });
    expect(msg).toBe("طلب IV-260101-AB12 بقيمة 87.00");
  });
});

describe("sanitizeWhatsappNumber", () => {
  it("strips all non-digit characters", () => {
    expect(sanitizeWhatsappNumber("+962 79 571 8978")).toBe("9627957 18978".replace(/\s/g, ""));
    expect(sanitizeWhatsappNumber("+962795718978")).toBe("962795718978");
  });
});

describe("buildWhatsappUrl", () => {
  it("builds a correctly encoded wa.me URL", () => {
    const url = buildWhatsappUrl("+962795718978", "مرحباً / اختبار");
    expect(url).toMatch(/^https:\/\/wa\.me\/962795718978\?text=/);
    expect(url).not.toContain(" ");
    const encoded = url.split("text=")[1] ?? "";
    expect(decodeURIComponent(encoded)).toBe("مرحباً / اختبار");
  });

  it("throws when the number is empty", () => {
    expect(() => buildWhatsappUrl("", "hi")).toThrow();
  });
});
