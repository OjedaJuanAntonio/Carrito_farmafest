"use client";

import { addItem, qtyOf, setQty } from "@/lib/cart";
import { getCart, updateCart, useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/types";

/**
 * Botón "Agregar" que se convierte en stepper − qty + cuando el producto
 * ya está en el carrito. Sin stock NO bloquea (el dato puede estar viejo;
 * la caja del stand decide).
 */
export function AddToCartButton({ product }: { product: Product }) {
  const cart = useCart();
  const qty = qtyOf(cart, product.codigo);

  if (qty === 0) {
    return (
      <button
        onClick={() => updateCart(addItem(getCart(), product))}
        className="h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold active:bg-brand-dark"
        aria-label={`Agregar ${product.descripcion} al carrito`}
      >
        Agregar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Cantidad">
      <button
        onClick={() => updateCart(setQty(getCart(), product.codigo, qty - 1))}
        className="w-10 h-10 rounded-xl border border-border-c bg-surface text-xl font-bold text-brand active:bg-brand-soft"
        aria-label="Quitar una unidad"
      >
        −
      </button>
      <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        onClick={() => updateCart(setQty(getCart(), product.codigo, qty + 1))}
        className="w-10 h-10 rounded-xl bg-brand text-white text-xl font-bold active:bg-brand-dark"
        aria-label="Agregar una unidad"
      >
        +
      </button>
    </div>
  );
}
