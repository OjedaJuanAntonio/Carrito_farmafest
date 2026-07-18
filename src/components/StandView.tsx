"use client";

import { useEffect, useMemo, useState } from "react";
import type { StandData } from "@/lib/types";
import { fetchStandData } from "@/lib/data";
import { normalizeText } from "@/lib/search";
import { ProductCard } from "./ProductCard";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; data: StandData };

/**
 * Mini-ecommerce del stand: solo productos de ese proveedor, sin mezclar.
 * Los datos (incluido el precio) se cargan en runtime; offline los sirve
 * el service worker desde cache.
 */
export function StandView({
  standId,
  proveedorInicial,
}: {
  standId: number;
  proveedorInicial: string;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetchStandData(standId)
      .then((data) => {
        if (!cancelled) setState({ status: "ok", data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [standId, reloadKey]);

  const productos = useMemo(() => {
    if (state.status !== "ok") return [];
    const q = normalizeText(query.trim());
    if (!q) return state.data.productos;
    return state.data.productos.filter(
      (p) => normalizeText(p.descripcion).includes(q) || p.codigo.includes(q)
    );
  }, [state, query]);

  const proveedor =
    state.status === "ok" ? state.data.proveedor : proveedorInicial;

  return (
    <div className="pt-4">
      <div className="rounded-2xl bg-brand text-white px-4 py-5 shadow">
        <p className="text-xs uppercase tracking-widest opacity-80">
          Stand {standId}
        </p>
        <h1 className="text-2xl font-bold leading-tight mt-1">{proveedor}</h1>
        {state.status === "ok" && (
          <p className="text-sm opacity-80 mt-1">
            {state.data.productos.length} productos
          </p>
        )}
      </div>

      <div className="sticky top-14 z-10 -mx-3 px-3 py-2 bg-bg/95 backdrop-blur">
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Buscar en este stand…`}
          aria-label="Buscar productos en este stand"
          className="w-full h-11 rounded-xl border border-border-c bg-surface px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
        />
      </div>

      {state.status === "loading" && <ProductListSkeleton />}

      {state.status === "error" && (
        <div className="text-center py-12 px-4">
          <p className="text-ink-muted">
            No pudimos cargar los productos. Si estás sin señal, volvé a
            intentar cuando tengas conexión.
          </p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-4 h-11 px-6 rounded-xl bg-brand text-white font-medium active:bg-brand-dark"
          >
            Reintentar
          </button>
        </div>
      )}

      {state.status === "ok" && (
        <>
          {productos.length === 0 ? (
            <p className="text-center text-ink-muted py-12">
              No hay productos que coincidan con “{query}”.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 mt-1">
              {productos.map((p) => (
                <li key={p.codigo}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ProductListSkeleton() {
  return (
    <ul className="flex flex-col gap-2 mt-1" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="h-[104px] rounded-xl bg-surface border border-border-c animate-pulse"
        />
      ))}
    </ul>
  );
}
