"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { groupByStand, refreshFromCatalog, removeItem, setQty } from "@/lib/cart";
import { getCart, updateCart, useCart } from "@/lib/cart-store";
import { fetchStandData, formatPrice } from "@/lib/data";
import { ProductImage } from "@/components/ProductImage";
import { useStandNames } from "@/lib/useStandNames";

/**
 * Carrito agrupado por stand: el checkout es POR STAND (cada stand tiene su
 * propia caja), así que cada grupo tiene su botón "Pasar por la caja".
 */
export default function CarritoPage() {
  const cart = useCart();
  const groups = useMemo(() => groupByStand(cart), [cart]);
  const standNames = useStandNames();

  // Refresca precios con el catálogo actual (pueden cambiar durante el evento)
  useEffect(() => {
    const standIds = [...new Set(getCart().items.map((i) => i.stand))];
    if (standIds.length === 0) return;
    let cancelled = false;
    Promise.all(standIds.map((id) => fetchStandData(id)))
      .then((datas) => {
        if (cancelled) return;
        const productos = datas.flatMap((d) => d.productos);
        const refreshed = refreshFromCatalog(getCart(), productos);
        if (refreshed !== getCart()) updateCart(refreshed);
      })
      .catch(() => {
        // sin conexión: se muestran los últimos precios conocidos
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center text-center pt-20 px-6">
        <p className="text-5xl" aria-hidden>
          🛒
        </p>
        <h1 className="text-xl font-bold mt-4">Tu carrito está vacío</h1>
        <p className="text-ink-muted text-sm mt-2">
          Escaneá el QR de un stand o buscá productos para empezar.
        </p>
        <Link
          href="/"
          className="mt-6 h-12 px-8 rounded-xl bg-brand text-white font-semibold flex items-center"
        >
          Buscar productos
        </Link>
      </div>
    );
  }

  const total = groups.reduce((n, g) => n + g.subtotal, 0);

  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold px-1">Mi carrito</h1>
      <p className="text-sm text-ink-muted px-1 mt-1">
        El pago es en la caja de cada stand. Cada grupo se cobra por separado.
      </p>

      <div className="flex flex-col gap-4 mt-4">
        {groups.map((g) => (
          <section
            key={g.stand}
            className="rounded-2xl bg-surface border border-border-c shadow-sm overflow-hidden"
          >
            <header className="px-4 py-3 bg-brand-soft flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-brand uppercase tracking-wide">
                  Stand {g.stand}
                </p>
                <p className="text-sm font-semibold truncate">
                  {standNames.get(g.stand) ?? ""}
                </p>
              </div>
              <p className="text-sm font-bold text-brand-dark whitespace-nowrap">
                {formatPrice(g.subtotal)}
              </p>
            </header>

            <ul className="divide-y divide-border-c">
              {g.items.map((item) => (
                <li key={item.codigo} className="flex gap-3 p-3">
                  <ProductImage
                    src={item.foto}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0 bg-bg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {item.descripcion}
                    </p>
                    <p className="text-sm font-bold text-brand-dark mt-0.5">
                      {formatPrice(item.precio)}
                      {item.qty > 1 && (
                        <span className="font-normal text-ink-muted">
                          {" "}
                          × {item.qty} = {formatPrice(item.precio * item.qty)}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() =>
                          updateCart(setQty(getCart(), item.codigo, item.qty - 1))
                        }
                        className="w-9 h-9 rounded-lg border border-border-c text-lg font-bold text-brand active:bg-brand-soft"
                        aria-label="Quitar una unidad"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        onClick={() =>
                          updateCart(setQty(getCart(), item.codigo, item.qty + 1))
                        }
                        className="w-9 h-9 rounded-lg border border-border-c text-lg font-bold text-brand active:bg-brand-soft"
                        aria-label="Agregar una unidad"
                      >
                        +
                      </button>
                      <button
                        onClick={() =>
                          updateCart(removeItem(getCart(), item.codigo))
                        }
                        className="ml-auto text-xs text-danger font-medium px-2 py-2 active:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="p-3 pt-1">
              <Link
                href={`/caja/${g.stand}/`}
                className="w-full h-12 rounded-xl bg-brand text-white font-semibold flex items-center justify-center active:bg-brand-dark"
              >
                Pasar por la caja · {g.unidades}{" "}
                {g.unidades === 1 ? "producto" : "productos"}
              </Link>
            </div>
          </section>
        ))}
      </div>

      <p className="text-right text-sm text-ink-muted mt-4 px-1">
        Total estimado del evento:{" "}
        <span className="font-bold text-ink">{formatPrice(total)}</span>
      </p>
    </div>
  );
}
