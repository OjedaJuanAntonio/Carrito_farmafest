"use client";

import Link from "next/link";
import { totalUnits } from "@/lib/cart";
import { useCart } from "@/lib/cart-store";

/** Ícono de carrito del header con badge de unidades. */
export function CartLink() {
  const cart = useCart();
  const units = totalUnits(cart);
  return (
    <Link
      href="/carrito/"
      className="relative flex items-center justify-center w-11 h-11 -mr-1 rounded-xl active:bg-brand-dark"
      aria-label={`Carrito, ${units} unidades`}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="9" cy="21" r="1.6" />
        <circle cx="19" cy="21" r="1.6" />
        <path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H6" />
      </svg>
      {units > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-accent text-[11px] font-bold text-ink flex items-center justify-center tabular-nums">
          {units > 99 ? "99+" : units}
        </span>
      )}
    </Link>
  );
}
