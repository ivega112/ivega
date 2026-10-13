export interface WhatsappOrderItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface WhatsappMessageInput {
  orderNumber: string;
  items: WhatsappOrderItem[];
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  total: number;
  deliveryLabel: string;
  paymentLabel: string;
  customerName: string;
  customerPhone: string;
  addressDetails?: string | null;
  notes?: string | null;
  currencyLabel?: string;
  /** Admin-managed template; {{var}} placeholders are substituted. Falls back to a default layout. */
  template?: string | null;
}

const DEFAULT_TEMPLATE = `طلب جديد #{{orderNumber}}

{{itemsList}}

الإجمالي الفرعي: {{subtotal}} {{currency}}
الخصم: {{discountTotal}} {{currency}}
التوصيل ({{deliveryLabel}}): {{deliveryFee}} {{currency}}
الإجمالي التقديري: {{total}} {{currency}}

الاسم: {{customerName}}
الهاتف: {{customerPhone}}
العنوان: {{addressDetails}}
الدفع: {{paymentLabel}}
ملاحظات: {{notes}}`;

export const WHATSAPP_TEMPLATE_PLACEHOLDERS = [
  "orderNumber",
  "itemsList",
  "subtotal",
  "discountTotal",
  "deliveryFee",
  "total",
  "deliveryLabel",
  "paymentLabel",
  "customerName",
  "customerPhone",
  "addressDetails",
  "notes",
  "currency",
] as const;

/** Returns any {{placeholder}} tokens in the template that aren't in the supported set. */
export function findUnknownTemplatePlaceholders(template: string): string[] {
  const found = new Set<string>();
  for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) {
    const key = match[1];
    if (key && !(WHATSAPP_TEMPLATE_PLACEHOLDERS as readonly string[]).includes(key)) {
      found.add(key);
    }
  }
  return [...found];
}

function fmt(n: number) {
  return n.toFixed(2);
}

export function buildWhatsappMessage(input: WhatsappMessageInput): string {
  const currency = input.currencyLabel ?? "د.أ";
  const itemsList = input.items
    .map((it, i) => `${i + 1}. ${it.name} (${it.sku}) × ${it.quantity} = ${fmt(it.lineTotal)} ${currency}`)
    .join("\n");

  const values: Record<string, string> = {
    orderNumber: input.orderNumber,
    itemsList,
    subtotal: fmt(input.subtotal),
    discountTotal: fmt(input.discountTotal),
    deliveryFee: fmt(input.deliveryFee),
    total: fmt(input.total),
    deliveryLabel: input.deliveryLabel,
    paymentLabel: input.paymentLabel,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    addressDetails: input.addressDetails?.trim() || "—",
    notes: input.notes?.trim() || "—",
    currency,
  };

  const template = input.template && input.template.trim().length > 0 ? input.template : DEFAULT_TEMPLATE;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
}

/** Strips everything but digits and a leading + for wa.me international format. */
export function sanitizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  return digits;
}

export function buildWhatsappUrl(internationalNumber: string, message: string): string {
  const number = sanitizeWhatsappNumber(internationalNumber);
  if (!number) throw new Error("A valid international WhatsApp number is required");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}
