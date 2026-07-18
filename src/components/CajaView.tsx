"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearStand, groupByStand } from "@/lib/cart";
import { getCart, updateCart, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/data";
import { getStrategy } from "@/lib/checkout";
import { QrCode } from "./QrCode";

/**
 * Vista de caja de UN stand: muestra el pedido según la estrategia
 * configurada (config.ts). `?variante=` permite probar otra variante
 * sin tocar código (útil mientras se define la integración POSBerry).
 */
export function CajaView({
  standId,
  proveedor,
}: {
  standId: number;
  proveedor: string;
}) {
  const router = useRouter();
  const cart = useCart();
  const [variantOverride, setVariantOverride] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVariantOverride(params.get("variante"));
  }, []);

  const group = useMemo(
    () => groupByStand(cart).find((g) => g.stand === standId),
    [cart, standId]
  );

  const strategy = getStrategy(variantOverride);
  const payload = useMemo(
    () => (group ? strategy.build({ group, proveedor }) : null),
    [group, strategy, proveedor]
  );

  if (!group || !payload) {
    return (
      <div className="flex flex-col items-center text-center pt-20 px-6">
        <p className="text-5xl" aria-hidden>
          ✅
        </p>
        <h1 className="text-xl font-bold mt-4">
          No tenés productos de este stand
        </h1>
        <p className="text-ink-muted text-sm mt-2">
          Stand {standId} · {proveedor}
        </p>
        <div className="flex gap-3 mt-6">
          <Link
            href={`/stand/${standId}/`}
            className="h-12 px-6 rounded-xl bg-brand text-white font-semibold flex items-center"
          >
            Ver productos
          </Link>
          <Link
            href="/carrito/"
            className="h-12 px-6 rounded-xl border border-border-c bg-surface font-semibold flex items-center"
          >
            Mi carrito
          </Link>
        </div>
      </div>
    );
  }

  const marcarComprado = () => {
    updateCart(clearStand(getCart(), standId));
    router.push("/carrito/");
  };

  return (
    <div className="pt-4 flex flex-col items-center">
      <header className="text-center">
        <p className="text-xs uppercase tracking-widest text-ink-muted">
          Caja · Stand {standId}
        </p>
        <h1 className="text-xl font-bold leading-tight mt-1">{proveedor}</h1>
        <p className="text-sm text-ink-muted mt-2">{strategy.instruccion}</p>
      </header>

      {payload.kind === "qr" && (
        <div className="mt-4 flex flex-col items-center">
          <QrCode data={payload.data} />
          <p className="text-[11px] text-ink-muted mt-2 text-center px-6">
            {payload.hint}
          </p>
        </div>
      )}

      {/* Lista legible: es LA pantalla en variante "pantalla" y el respaldo
          si el QR no escanea en las variantes con QR. */}
      <section className="w-full mt-5 rounded-2xl bg-surface border border-border-c shadow-sm overflow-hidden">
        <header className="px-4 py-2.5 bg-brand-soft">
          <p className="text-sm font-semibold">
            {payload.kind === "qr"
              ? "Si el QR no escanea, usá esta lista:"
              : "Pedido para la caja"}
          </p>
        </header>
        <ul className="divide-y divide-border-c">
          {group.items.map((item) => (
            <li key={item.codigo} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium leading-snug">
                  <span className="font-bold tabular-nums">{item.qty}×</span>{" "}
                  {item.descripcion}
                </p>
                <p className="text-sm font-bold whitespace-nowrap">
                  {formatPrice(item.precio * item.qty)}
                </p>
              </div>
              <p className="font-mono text-base tracking-wider mt-1">
                {item.codigo}
              </p>
            </li>
          ))}
        </ul>
        <div className="px-4 py-3 bg-brand-soft flex items-baseline justify-between">
          <p className="font-semibold">
            Total · {group.unidades}{" "}
            {group.unidades === 1 ? "unidad" : "unidades"}
          </p>
          <p className="text-xl font-bold text-brand-dark">
            {formatPrice(group.subtotal)}
          </p>
        </div>
      </section>

      <p className="text-[11px] text-ink-muted text-center mt-3 px-6">
        Los precios los confirma la caja del stand al cobrar.
      </p>

      <div className="w-full mt-5 flex flex-col gap-2">
        {confirming ? (
          <>
            <p className="text-center text-sm font-medium">
              ¿Ya pagaste en la caja? Esto vacía los productos de este stand.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 h-12 rounded-xl border border-border-c bg-surface font-semibold"
              >
                Todavía no
              </button>
              <button
                onClick={marcarComprado}
                className="flex-1 h-12 rounded-xl bg-brand text-white font-semibold active:bg-brand-dark"
              >
                Sí, listo
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full h-12 rounded-xl bg-brand text-white font-semibold active:bg-brand-dark"
          >
            Ya pasé por la caja
          </button>
        )}
        <Link
          href="/carrito/"
          className="w-full h-12 rounded-xl border border-border-c bg-surface font-semibold flex items-center justify-center"
        >
          Volver al carrito
        </Link>
      </div>
    </div>
  );
}
