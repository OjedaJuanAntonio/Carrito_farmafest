"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_CART, type Cart } from "./cart";

/**
 * Store mínimo del carrito sobre localStorage, con suscripción para React
 * (useSyncExternalStore) y sincronización entre pestañas vía evento storage.
 */

const STORAGE_KEY = "farmafest.cart.v1";

let cart: Cart = EMPTY_CART;
let loaded = false;
const listeners = new Set<() => void>();

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Cart;
      if (Array.isArray(parsed.items)) cart = parsed;
    }
  } catch {
    // storage corrupto o bloqueado: arrancamos con carrito vacío
    cart = EMPTY_CART;
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      cart = e.newValue ? (JSON.parse(e.newValue) as Cart) : EMPTY_CART;
    } catch {
      return;
    }
    emit();
  });
}

function emit(): void {
  for (const l of listeners) l();
}

export function getCart(): Cart {
  load();
  return cart;
}

export function updateCart(next: Cart): void {
  cart = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sin espacio o modo privado estricto: el carrito sigue en memoria
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getServerSnapshot = (): Cart => EMPTY_CART;

/** Hook: carrito reactivo (mismo estado en todas las vistas/pestañas). */
export function useCart(): Cart {
  return useSyncExternalStore(subscribe, getCart, getServerSnapshot);
}
