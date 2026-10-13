"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCart } from "./cart-context";
import type { ProductCardData } from "./product-card";
import { calculateSubtotal } from "@/lib/pricing";

/**
 * Storefront-only UI state: the side cart drawer, the quick-view modal, and the cart's
 * product data (fetched once from /api/catalog/by-ids so campaign prices apply) shared by
 * the header cart pill, the drawer and the cart page instead of three separate fetches.
 */
interface StorefrontUiValue {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  quickView: ProductCardData | null;
  openQuickView: (product: ProductCardData) => void;
  closeQuickView: () => void;
  cartProducts: ProductCardData[];
  cartProductsLoading: boolean;
  cartSubtotal: number;
}

const StorefrontUiContext = createContext<StorefrontUiValue | null>(null);

export function StorefrontUiProvider({ children }: { children: React.ReactNode }) {
  const { lines, hydrated } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<ProductCardData | null>(null);
  const [cartProducts, setCartProducts] = useState<ProductCardData[]>([]);
  const [cartProductsLoading, setCartProductsLoading] = useState(true);

  // Only refetch when the set of product ids changes — quantity edits reuse loaded data.
  const idsKey = useMemo(() => [...new Set(lines.map((l) => l.productId))].sort().join(","), [lines]);

  useEffect(() => {
    if (!hydrated) return;
    if (!idsKey) {
      setCartProducts([]);
      setCartProductsLoading(false);
      return;
    }
    let cancelled = false;
    setCartProductsLoading(true);
    fetch(`/api/catalog/by-ids?ids=${idsKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCartProducts(data.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setCartProducts([]);
      })
      .finally(() => {
        if (!cancelled) setCartProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idsKey, hydrated]);

  const cartSubtotal = useMemo(() => {
    const priced = lines
      .map((l) => {
        const p = cartProducts.find((x) => x.id === l.productId);
        return p ? { unitPrice: p.price, quantity: l.quantity } : null;
      })
      .filter((x): x is { unitPrice: number; quantity: number } => x !== null);
    return calculateSubtotal(priced);
  }, [lines, cartProducts]);

  const openQuickView = useCallback((product: ProductCardData) => setQuickView(product), []);
  const closeQuickView = useCallback(() => setQuickView(null), []);

  return (
    <StorefrontUiContext.Provider
      value={{ cartOpen, setCartOpen, quickView, openQuickView, closeQuickView, cartProducts, cartProductsLoading, cartSubtotal }}
    >
      {children}
    </StorefrontUiContext.Provider>
  );
}

export function useStorefrontUi(): StorefrontUiValue {
  const ctx = useContext(StorefrontUiContext);
  if (!ctx) throw new Error("useStorefrontUi must be used within StorefrontUiProvider");
  return ctx;
}
