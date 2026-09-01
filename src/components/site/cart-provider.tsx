"use client";

import * as React from "react";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  customText?: string;
  customImageUrl?: string;
};

const STORAGE_KEY = "tgy.cart.v1";

/**
 * The cart lives in a tiny external store rather than component state, so
 * `useSyncExternalStore` can hand the server an empty cart and the browser the
 * saved one without a setState-in-effect hydration dance.
 */
const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
  } catch {
    // A corrupt or blocked store just means an empty cart.
    return EMPTY;
  }
}

function write(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing can refuse writes; the in-memory cart still works.
  }
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  items = read();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => items;
const getServerSnapshot = () => EMPTY;

function mutate(updater: (current: CartItem[]) => CartItem[]) {
  write(updater(items));
}

export function useCart() {
  const current = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return React.useMemo(() => {
    return {
      items: current,
      ready,
      count: current.reduce((total, item) => total + item.quantity, 0),
      subtotal: current.reduce((total, item) => total + item.price * item.quantity, 0),
      add: (item: CartItem) =>
        mutate((existingItems) => {
          // Only merge lines that are truly identical, so two different
          // customisations of the same mug stay separate.
          const index = existingItems.findIndex(
            (existing) =>
              existing.productId === item.productId &&
              (existing.customText ?? "") === (item.customText ?? "") &&
              (existing.customImageUrl ?? "") === (item.customImageUrl ?? ""),
          );
          if (index === -1) return [...existingItems, item];
          const next = [...existingItems];
          next[index] = { ...next[index], quantity: next[index].quantity + item.quantity };
          return next;
        }),
      updateQuantity: (index: number, quantity: number) =>
        mutate((existingItems) =>
          existingItems.map((item, i) =>
            i === index ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) } : item,
          ),
        ),
      remove: (index: number) =>
        mutate((existingItems) => existingItems.filter((_, i) => i !== index)),
      clear: () => mutate(() => []),
    };
  }, [current, ready]);
}

/** Kept as a component so the shop layout reads clearly and future context work has a home. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
