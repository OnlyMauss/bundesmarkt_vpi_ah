import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "@shared/types";

const STORAGE = "vpi-markt-cart-v1";

type CartContextValue = {
  lines: CartLine[];
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        productId: String((x as CartLine).productId ?? ""),
        qty: Math.min(
          99,
          Math.max(1, Math.floor(Number((x as CartLine).qty) || 0)),
        ),
      }))
      .filter((l) => l.productId);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() =>
    typeof window === "undefined" ? [] : loadLines(),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((productId: string, qty = 1) => {
    const q = Math.min(99, Math.max(1, qty));
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === productId);
      if (i === -1) return [...prev, { productId, qty: q }];
      const next = [...prev];
      next[i] = {
        productId,
        qty: Math.min(99, next[i].qty + q),
      };
      return next;
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    const q = Math.min(99, Math.max(0, Math.floor(qty)));
    setLines((prev) => {
      if (q <= 0) return prev.filter((l) => l.productId !== productId);
      const i = prev.findIndex((l) => l.productId === productId);
      if (i === -1) return [...prev, { productId, qty: q }];
      const next = [...prev];
      next[i] = { productId, qty: q };
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(
    () => lines.reduce((a, l) => a + l.qty, 0),
    [lines],
  );

  const value = useMemo(
    () => ({ lines, add, setQty, remove, clear, count }),
    [lines, add, setQty, remove, clear, count],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart только внутри CartProvider");
  return ctx;
}
