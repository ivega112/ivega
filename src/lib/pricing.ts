export type MoneyInput = number | string;

export function toMoney(value: MoneyInput): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) throw new Error(`Invalid money value: ${value}`);
  return Math.round(n * 1000) / 1000;
}

export function calculateDiscountPercent(price: number, oldPrice: number | null | undefined): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export interface CartLineInput {
  unitPrice: number;
  quantity: number;
}

export function calculateSubtotal(lines: CartLineInput[]): number {
  const total = lines.reduce((sum, line) => sum + toMoney(line.unitPrice) * line.quantity, 0);
  return toMoney(total);
}

export interface OrderTotalsInput {
  subtotal: number;
  discountTotal?: number;
  deliveryFee?: number;
}

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  total: number;
}

export function calculateOrderTotals({ subtotal, discountTotal = 0, deliveryFee = 0 }: OrderTotalsInput): OrderTotals {
  const s = toMoney(subtotal);
  const d = toMoney(discountTotal);
  const f = toMoney(deliveryFee);
  const total = toMoney(Math.max(0, s - d) + f);
  return { subtotal: s, discountTotal: d, deliveryFee: f, total };
}

export function formatCurrency(amount: MoneyInput, decimals = 2): string {
  const n = toMoney(amount);
  return `${n.toFixed(decimals)} د.أ`;
}

export function clampQuantity(requested: number, available: number): number {
  if (available <= 0) return 0;
  if (requested < 1) return 1;
  return Math.min(requested, available);
}
