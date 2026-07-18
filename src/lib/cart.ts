import type { Product } from "./types";

/**
 * Carrito local: vive en localStorage del teléfono (mecanismo esperado).
 * Se agrupa por stand porque el checkout es POR STAND: cada stand tiene su
 * propia caja. Lógica pura acá; persistencia y React en cart-store.ts.
 */

export interface CartItem {
  codigo: string;
  descripcion: string;
  /** Último precio conocido del catálogo (se refresca al ver el carrito). */
  precio: number;
  stand: number;
  qty: number;
  foto?: string;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

export const EMPTY_CART: Cart = { items: [], updatedAt: "" };

function touch(items: CartItem[]): Cart {
  return { items, updatedAt: new Date().toISOString() };
}

/** Agrega 1 unidad (o crea el ítem) a partir de un producto del catálogo. */
export function addItem(cart: Cart, product: Product): Cart {
  const existing = cart.items.find((i) => i.codigo === product.codigo);
  if (existing) {
    return setQty(cart, product.codigo, existing.qty + 1);
  }
  const item: CartItem = {
    codigo: product.codigo,
    descripcion: product.descripcion,
    precio: product.precio,
    stand: product.stand,
    qty: 1,
  };
  if (product.foto) item.foto = product.foto;
  return touch([...cart.items, item]);
}

/** Fija la cantidad de un ítem; qty <= 0 lo elimina. */
export function setQty(cart: Cart, codigo: string, qty: number): Cart {
  if (qty <= 0) return removeItem(cart, codigo);
  const capped = Math.min(qty, 999);
  return touch(
    cart.items.map((i) => (i.codigo === codigo ? { ...i, qty: capped } : i))
  );
}

export function removeItem(cart: Cart, codigo: string): Cart {
  return touch(cart.items.filter((i) => i.codigo !== codigo));
}

/** Vacía los ítems de un stand (después de pasar por su caja). */
export function clearStand(cart: Cart, standId: number): Cart {
  return touch(cart.items.filter((i) => i.stand !== standId));
}

export function clearAll(): Cart {
  return touch([]);
}

/**
 * Refresca precios/descripciones con datos nuevos del catálogo (los precios
 * pueden cambiar durante el evento). No toca cantidades ni ítems que ya no
 * estén en el catálogo (se cobran igual en caja; el POS manda).
 */
export function refreshFromCatalog(cart: Cart, productos: Product[]): Cart {
  const byCode = new Map(productos.map((p) => [p.codigo, p]));
  let changed = false;
  const items = cart.items.map((i) => {
    const p = byCode.get(i.codigo);
    if (!p) return i;
    if (p.precio !== i.precio || p.descripcion !== i.descripcion) {
      changed = true;
      return { ...i, precio: p.precio, descripcion: p.descripcion };
    }
    return i;
  });
  return changed ? touch(items) : cart;
}

// ---------- Selectores ----------

export interface StandGroup {
  stand: number;
  items: CartItem[];
  unidades: number;
  subtotal: number;
}

/** Agrupa el carrito por stand, ordenado por número de stand. */
export function groupByStand(cart: Cart): StandGroup[] {
  const map = new Map<number, CartItem[]>();
  for (const item of cart.items) {
    const list = map.get(item.stand) ?? [];
    list.push(item);
    map.set(item.stand, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([stand, items]) => ({
      stand,
      items,
      unidades: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.precio * i.qty, 0),
    }));
}

export function totalUnits(cart: Cart): number {
  return cart.items.reduce((n, i) => n + i.qty, 0);
}

export function qtyOf(cart: Cart, codigo: string): number {
  return cart.items.find((i) => i.codigo === codigo)?.qty ?? 0;
}
