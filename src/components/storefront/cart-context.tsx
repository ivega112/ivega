"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface PersistedShape<T> {
  version: number;
  data: T;
}

const CART_KEY = "smartline:cart";
const RECENT_KEY = "smartline:recent";
const CURRENT_VERSION = 1;

function loadVersioned<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: PersistedShape<T> = JSON.parse(raw);
    if (parsed.version !== CURRENT_VERSION) return fallback; // schema bumped — safe reset instead of crash
    return parsed.data;
  } catch {
    return fallback;
  }
}

function saveVersioned<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  const payload: PersistedShape<T> = { version: CURRENT_VERSION, data };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

interface CartContextValue {
  lines: CartLine[];
  recentlyViewed: string[];
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  /** Removes stale product ids (for example, from a previous database/deployment). */
  keepOnlyProducts: (productIds: string[]) => void;
  clearCart: () => void;
  recordRecentlyViewed: (productId: string) => void;
  cartCount: number;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(loadVersioned(CART_KEY, [] as CartLine[]));
    setRecentlyViewed(loadVersioned(RECENT_KEY, [] as string[]));
    setHydrated(true);

    // One-time cleanup: wishlist storage was removed — drop any leftover data from
    // browsers that had it, rather than leaving orphaned localStorage entries.
    try {
      window.localStorage.removeItem("smartline:wishlist");
    } catch {
      // ignore — localStorage may be unavailable (private mode, etc.)
    }
  }, []);

  useEffect(() => {
    if (hydrated) saveVersioned(CART_KEY, lines);
  }, [lines, hydrated]);
  useEffect(() => {
    if (hydrated) saveVersioned(RECENT_KEY, recentlyViewed);
  }, [recentlyViewed, hydrated]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      const cap = 99;
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, quantity: Math.min(cap, l.quantity + quantity) } : l
        );
      }
      return [...prev, { productId, quantity: Math.min(cap, Math.max(1, quantity)) }];
    });
    toast.success("تم إضافة المنتج إلى السلة بنجاح");
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const cap = 99;
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(cap, quantity) } : l));
    });
  }, []);

  const keepOnlyProducts = useCallback((productIds: string[]) => {
    const validIds = new Set(productIds);
    setLines((prev) => prev.filter((line) => validIds.has(line.productId)));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const recordRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 12));
  }, []);

  const cartCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  const value: CartContextValue = {
    lines,
    recentlyViewed,
    addToCart,
    removeFromCart,
    setQuantity,
    keepOnlyProducts,
    clearCart,
    recordRecentlyViewed,
    cartCount,
    hydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
